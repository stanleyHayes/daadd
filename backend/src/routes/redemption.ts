import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { Redemption, Reward, User, Notification } from '../models';
import { authMiddleware, JWT_SECRET } from '../middleware/auth';
import { success } from '../utils/response';

const router = Router();

const TOKEN_VALUE = parseFloat(process.env.TOKEN_VALUE || '0.05');
const MAX_DISCOUNT_PCT = parseFloat(process.env.MAX_DISCOUNT_PCT || '0.15');
const QR_EXPIRY_SECONDS = parseInt(process.env.QR_EXPIRY_SECONDS || '120', 10);

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

async function getSpendableBalance(userId: string): Promise<number> {
  const result = await Reward.aggregate([
    { $match: { user_id: userId, status: { $in: ['approved', 'paid'] } } },
    {
      $group: {
        _id: '$user_id',
        balance: { $sum: '$amount' },
      },
    },
  ]);
  return result[0]?.balance || 0;
}

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
    });

    const payload = JSON.stringify({
      rid: String(redemption._id),
      uid: String(userId),
      tokens,
      ts: Date.now(),
      nonce,
    });
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');

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

router.post('/scan', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { qr, signature } = req.body;
    if (!qr || !signature) {
      res.status(400).json({ success: false, message: 'QR payload and signature are required' });
      return;
    }

    const expected = crypto.createHmac('sha256', JWT_SECRET).update(String(qr)).digest('hex');
    if (expected !== signature) {
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

    redemption.status = 'scanned';
    redemption.merchant_id = req.user!.userId;
    await redemption.save();

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

router.post('/validate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { redemption_id, purchase_amount } = req.body;
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

    const discount = round2(
      Math.min(redemption.tokens * TOKEN_VALUE, purchase_amount * MAX_DISCOUNT_PCT)
    );
    const tokensUsed = Math.ceil(discount / TOKEN_VALUE);
    const finalAmount = round2(purchase_amount - discount);

    redemption.status = 'validated';
    redemption.purchase_amount = purchase_amount;
    redemption.discount_amount = discount;
    redemption.final_amount = finalAmount;
    await redemption.save();

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

router.post('/confirm', authMiddleware, async (req: Request, res: Response) => {
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

    const balance = await getSpendableBalance(String(redemption.user_id));
    if (balance < tokensUsed * TOKEN_VALUE) {
      res.status(409).json({ success: false, message: 'Customer balance is insufficient' });
      return;
    }

    await Reward.create({
      user_id: redemption.user_id,
      amount: -(tokensUsed * TOKEN_VALUE),
      status: 'paid',
      type: 'redemption',
      note: `Redemption ${redemption._id}: ${tokensUsed} tokens, $${discount} discount`,
    });

    redemption.status = 'completed';
    redemption.used_at = new Date();
    await redemption.save();

    await Notification.create({
      user_id: redemption.user_id,
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

export default router;
