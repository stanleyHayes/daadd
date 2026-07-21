import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { Redemption, Reward, User, Notification, Campaign, Outlet } from '../models';
import { authMiddleware, JWT_SECRET } from '../middleware/auth';
import { success, paginated } from '../utils/response';

const router = Router();

const TOKEN_VALUE = parseFloat(process.env.TOKEN_VALUE || '0.05');
const MAX_DISCOUNT_PCT = parseFloat(process.env.MAX_DISCOUNT_PCT || '0.15');
const QR_EXPIRY_SECONDS = parseInt(process.env.QR_EXPIRY_SECONDS || '120', 10);
const QR_SIGNING_SECRET = process.env.QR_SIGNING_SECRET || JWT_SECRET;

const MERCHANT_ROLES = ['merchant', 'advertiser', 'admin'];

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Constant-time signature comparison (both inputs are hex HMAC digests). */
function signaturesMatch(expected: string, provided: string): boolean {
  const expectedBuf = Buffer.from(expected, 'utf8');
  const providedBuf = Buffer.from(provided, 'utf8');
  return (
    expectedBuf.length === providedBuf.length && crypto.timingSafeEqual(expectedBuf, providedBuf)
  );
}

/** Only merchant-side roles may drive the scan → validate → confirm flow. */
function requireMerchant(req: Request, res: Response, next: NextFunction): void {
  if (!MERCHANT_ROLES.includes(req.user?.role || '')) {
    res.status(403).json({ success: false, message: 'Merchant access required' });
    return;
  }
  next();
}

async function getSpendableBalance(userId: string): Promise<number> {
  const result = await Reward.aggregate([
    { $match: { user_id: new Types.ObjectId(userId), status: { $in: ['approved', 'paid'] } } },
    {
      $group: {
        _id: '$user_id',
        balance: { $sum: '$amount' },
      },
    },
  ]);
  return result[0]?.balance || 0;
}

/**
 * The signed-in customer's purchase history (Area 3): where they shopped, what
 * they spent, the discount received, tokens redeemed and the items bought.
 * `user_id` is a Mixed field historically written as a string — match both.
 */
router.get('/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { page = '1', limit = '20' } = req.query as Record<string, string | undefined>;
    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit || '20', 10)));

    const filter: Record<string, any> = {
      user_id: { $in: [userId, new Types.ObjectId(userId)] },
      status: 'completed',
    };
    const total = await Redemption.countDocuments(filter);
    const rows = await Redemption.find(filter)
      .sort({ used_at: -1, created_at: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    // Resolve merchant / outlet / campaign labels in one query each.
    // `.filter(Boolean)` doesn't narrow away `undefined` in TS — cast for the $in.
    const merchantIds = rows.map((r) => r.merchant_id).filter(Boolean) as any[];
    const outletIds = rows.map((r) => r.outlet_id).filter(Boolean) as any[];
    const campaignIds = rows.map((r) => r.campaign_id).filter(Boolean) as any[];
    const [merchants, outlets, campaigns] = await Promise.all([
      merchantIds.length ? User.find({ _id: { $in: merchantIds } }).select('name').lean() : [],
      outletIds.length ? Outlet.find({ _id: { $in: outletIds } }).select('name city address').lean() : [],
      campaignIds.length ? Campaign.find({ _id: { $in: campaignIds } }).select('name').lean() : [],
    ]);
    const merchantById = new Map(merchants.map((m) => [String(m._id), m]));
    const outletById = new Map(outlets.map((o) => [String(o._id), o]));
    const campaignById = new Map(campaigns.map((c) => [String(c._id), c]));

    const history = rows.map((r) => {
      const outlet = r.outlet_id ? outletById.get(String(r.outlet_id)) : undefined;
      return {
        id: String(r._id),
        merchant: merchantById.get(String(r.merchant_id))?.name || 'Merchant',
        campaign: campaignById.get(String(r.campaign_id))?.name || '',
        outlet: outlet ? { name: outlet.name, city: outlet.city || '', address: outlet.address || '' } : null,
        purchase_amount: r.purchase_amount ?? 0,
        discount_amount: r.discount_amount ?? 0,
        final_amount: r.final_amount ?? 0,
        tokens: r.tokens,
        items: r.items || [],
        receipt_no: r.receipt_no || '',
        date: r.used_at || r.created_at,
      };
    });

    res.json(paginated(history, total, pageNum, limitNum));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch purchase history' });
  }
});

router.post('/qr', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { tokens } = req.body;
    if (!Number.isInteger(tokens) || tokens <= 0) {
      res.status(400).json({ success: false, message: 'Tokens must be a positive integer' });
      return;
    }

    const userId = req.user!.userId;
    const balance = await getSpendableBalance(userId);
    const maxTokens = Math.floor(balance / TOKEN_VALUE);
    if (tokens > maxTokens) {
      res.status(400).json({
        success: false,
        message: `Insufficient balance: requested ${tokens} tokens but maximum is ${maxTokens}`,
      });
      return;
    }

    const nonce = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + QR_EXPIRY_SECONDS * 1000);
    const redemption = await Redemption.create({
      user_id: userId,
      tokens,
      nonce,
      status: 'pending',
      expires_at: expiresAt,
      // Campaign attribution is decided server-side at validate time from the
      // merchant's own campaign — never from a customer-supplied value.
    });

    const payload = JSON.stringify({
      rid: String(redemption._id),
      uid: String(userId),
      tokens,
      ts: Date.now(),
      nonce,
    });
    const signature = crypto.createHmac('sha256', QR_SIGNING_SECRET).update(payload).digest('hex');

    res.json(
      success({
        redemption_id: String(redemption._id),
        qr: payload,
        signature,
        expires_at: expiresAt,
      })
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to generate QR code' });
  }
});

router.post('/scan', authMiddleware, requireMerchant, async (req: Request, res: Response) => {
  try {
    const { qr, signature } = req.body;
    if (!qr || !signature) {
      res.status(400).json({ success: false, message: 'QR payload and signature are required' });
      return;
    }

    const expected = crypto.createHmac('sha256', QR_SIGNING_SECRET).update(String(qr)).digest('hex');
    if (!signaturesMatch(expected, String(signature))) {
      res.status(400).json({ success: false, message: 'Invalid signature' });
      return;
    }

    let data: { rid?: string; uid?: string; tokens?: number; nonce?: string };
    try {
      data = JSON.parse(String(qr));
    } catch {
      res.status(400).json({ success: false, message: 'Invalid QR payload' });
      return;
    }

    const redemption = await Redemption.findById(data.rid);
    if (!redemption) {
      res.status(404).json({ success: false, message: 'Redemption not found' });
      return;
    }

    if (redemption.status !== 'pending') {
      res.status(409).json({ success: false, message: `Redemption is ${redemption.status}` });
      return;
    }
    if (redemption.expires_at <= new Date()) {
      redemption.status = 'expired';
      await redemption.save();
      res.status(410).json({ success: false, message: 'Redemption has expired' });
      return;
    }
    if (String(redemption.user_id) !== String(data.uid)) {
      res.status(400).json({ success: false, message: 'QR payload does not match redemption' });
      return;
    }
    if (redemption.nonce !== data.nonce) {
      res.status(400).json({ success: false, message: 'Invalid nonce' });
      return;
    }

    // Atomic transition: only one concurrent scan can move pending → scanned.
    const scanned = await Redemption.findOneAndUpdate(
      { _id: redemption._id, status: 'pending' },
      { $set: { status: 'scanned', merchant_id: req.user!.userId } },
      { new: true }
    );
    if (!scanned) {
      res.status(409).json({ success: false, message: 'Redemption is no longer pending' });
      return;
    }

    const customer = await User.findById(redemption.user_id).lean();

    res.json(
      success({
        redemption_id: String(redemption._id),
        customer_name: customer?.name || 'Customer',
        tokens: redemption.tokens,
        expires_at: redemption.expires_at,
      })
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to scan redemption' });
  }
});

router.post('/validate', authMiddleware, requireMerchant, async (req: Request, res: Response) => {
  try {
    const { redemption_id, purchase_amount, campaign_id } = req.body;
    if (!redemption_id || typeof purchase_amount !== 'number' || purchase_amount <= 0) {
      res
        .status(400)
        .json({ success: false, message: 'redemption_id and a positive purchase_amount are required' });
      return;
    }

    const redemption = await Redemption.findById(redemption_id);
    if (!redemption) {
      res.status(404).json({ success: false, message: 'Redemption not found' });
      return;
    }
    if (redemption.status !== 'scanned') {
      res.status(409).json({ success: false, message: `Redemption is ${redemption.status}` });
      return;
    }
    if (String(redemption.merchant_id) !== String(req.user!.userId)) {
      res.status(403).json({ success: false, message: 'Redemption was scanned by another merchant' });
      return;
    }
    if (redemption.expires_at <= new Date()) {
      redemption.status = 'expired';
      await redemption.save();
      res.status(410).json({ success: false, message: 'Redemption has expired' });
      return;
    }

    // Attribution and discount rate are decided server-side from a campaign the
    // VALIDATING MERCHANT owns — never a customer-supplied value — so a customer
    // cannot point a redemption at an arbitrary campaign to inflate their
    // discount or poison another advertiser's metrics. The merchant may name
    // which of their active campaigns this sale counts toward; absent a valid
    // owned choice we default to their most-recent active campaign, and fall
    // back to the global default rate when they have no active campaign at all.
    let discountRate = MAX_DISCOUNT_PCT;
    let campaignId: Types.ObjectId | undefined;
    const chosenCampaign =
      campaign_id && Types.ObjectId.isValid(String(campaign_id))
        ? new Types.ObjectId(String(campaign_id))
        : null;
    const merchantCampaign =
      (chosenCampaign
        ? await Campaign.findOne({
            _id: chosenCampaign,
            owner: req.user!.userId,
            status: 'active',
          })
            .select('discount_percentage')
            .lean()
        : null) ||
      (await Campaign.findOne({ owner: req.user!.userId, status: 'active' })
        .select('discount_percentage')
        .sort({ _id: -1 })
        .lean());
    if (merchantCampaign) {
      campaignId = merchantCampaign._id as Types.ObjectId;
      if (typeof merchantCampaign.discount_percentage === 'number') {
        discountRate = merchantCampaign.discount_percentage / 100;
      }
    }

    const discount = round2(
      Math.min(redemption.tokens * TOKEN_VALUE, purchase_amount * discountRate)
    );
    const tokensUsed = Math.ceil(discount / TOKEN_VALUE);
    const finalAmount = round2(purchase_amount - discount);

    // Atomic transition: only one concurrent validate can move scanned → validated.
    const validated = await Redemption.findOneAndUpdate(
      { _id: redemption._id, status: 'scanned' },
      {
        $set: {
          status: 'validated',
          purchase_amount,
          discount_amount: discount,
          final_amount: finalAmount,
          ...(campaignId ? { campaign_id: campaignId } : {}),
        },
      },
      { new: true }
    );
    if (!validated) {
      res.status(409).json({ success: false, message: 'Redemption is no longer scanned' });
      return;
    }

    const customer = await User.findById(redemption.user_id).lean();

    res.json(
      success({
        redemption_id: String(redemption._id),
        purchase_amount: purchase_amount,
        discount,
        final_amount: finalAmount,
        tokens_used: tokensUsed,
        customer_name: customer?.name || 'Customer',
      })
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to validate redemption' });
  }
});

router.post('/confirm', authMiddleware, requireMerchant, async (req: Request, res: Response) => {
  try {
    const { redemption_id } = req.body;
    if (!redemption_id) {
      res.status(400).json({ success: false, message: 'redemption_id is required' });
      return;
    }

    const redemption = await Redemption.findById(redemption_id);
    if (!redemption) {
      res.status(404).json({ success: false, message: 'Redemption not found' });
      return;
    }
    if (redemption.status !== 'validated') {
      res.status(409).json({ success: false, message: `Redemption is ${redemption.status}` });
      return;
    }
    if (String(redemption.merchant_id) !== String(req.user!.userId)) {
      res.status(403).json({ success: false, message: 'Redemption was scanned by another merchant' });
      return;
    }
    if (redemption.expires_at <= new Date()) {
      redemption.status = 'expired';
      await redemption.save();
      res.status(410).json({ success: false, message: 'Redemption has expired' });
      return;
    }

    const tokensUsed = Math.ceil((redemption.discount_amount || 0) / TOKEN_VALUE);
    const discount = redemption.discount_amount || 0;

    // Atomic transition: only the winner of a concurrent confirm race moves
    // validated → completed, and only the winner may debit the ledger below.
    const completed = await Redemption.findOneAndUpdate(
      { _id: redemption._id, status: 'validated' },
      { $set: { status: 'completed', used_at: new Date() } },
      { new: true }
    );
    if (!completed) {
      res.status(409).json({ success: false, message: 'Redemption is no longer validated' });
      return;
    }

    const balance = await getSpendableBalance(String(redemption.user_id));
    if (balance < tokensUsed * TOKEN_VALUE) {
      // No funds to debit: hand the redemption back to the validated state.
      await Redemption.findOneAndUpdate(
        { _id: redemption._id, status: 'completed' },
        { $set: { status: 'validated' }, $unset: { used_at: 1 } }
      );
      res.status(409).json({ success: false, message: 'Customer balance is insufficient' });
      return;
    }

    await Reward.create({
      user_id: new Types.ObjectId(String(redemption.user_id)),
      amount: -(tokensUsed * TOKEN_VALUE),
      status: 'paid',
      type: 'redemption',
      note: `Redemption ${redemption._id}: ${tokensUsed} tokens, $${discount} discount`,
    });

    await Notification.create({
      user_id: new Types.ObjectId(String(redemption.user_id)),
      type: 'reward',
      title: 'Redemption Complete',
      message: `You redeemed ${tokensUsed} tokens for a $${discount.toFixed(2)} discount.`,
    });

    const newBalance = round2(balance - tokensUsed * TOKEN_VALUE);

    res.json(
      success({
        redemption_id: String(redemption._id),
        tokens_used: tokensUsed,
        discount,
        new_balance: newBalance,
      })
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to confirm redemption' });
  }
});

router.post('/reject', authMiddleware, requireMerchant, async (req: Request, res: Response) => {
  try {
    const { redemption_id } = req.body;
    if (!redemption_id) {
      res.status(400).json({ success: false, message: 'redemption_id is required' });
      return;
    }

    const redemption = await Redemption.findById(redemption_id);
    if (!redemption) {
      res.status(404).json({ success: false, message: 'Redemption not found' });
      return;
    }
    if (redemption.status !== 'scanned' && redemption.status !== 'validated') {
      res.status(409).json({ success: false, message: `Redemption is ${redemption.status}` });
      return;
    }
    if (String(redemption.merchant_id) !== String(req.user!.userId)) {
      res.status(403).json({ success: false, message: 'Redemption was scanned by another merchant' });
      return;
    }

    // Atomic transition: only one concurrent reject can leave scanned/validated.
    const rejected = await Redemption.findOneAndUpdate(
      { _id: redemption._id, status: { $in: ['scanned', 'validated'] } },
      { $set: { status: 'rejected' } },
      { new: true }
    );
    if (!rejected) {
      res.status(409).json({ success: false, message: 'Redemption is no longer rejectable' });
      return;
    }

    res.json(
      success({
        redemption_id: String(redemption._id),
        status: rejected.status,
      })
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to reject redemption' });
  }
});

export default router;
