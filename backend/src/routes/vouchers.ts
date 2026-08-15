import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { DiscountVoucher, Reward, Notification, User, MerchantVerification, UserRole } from '../models';
import { authMiddleware } from '../middleware/auth';
import { merchantGate } from '../utils/merchant-gate';
import { spendableBalance } from '../utils/wallet';
import {
  generateVoucherCode,
  TOKEN_VALUE,
  VOUCHER_TTL_DAYS,
  VOUCHER_MAX_TOKENS,
  round2,
} from '../utils/voucher';
import { success } from '../utils/response';

/**
 * Discount vouchers (Phase 3.1): the compliant way to give value to another
 * user. Issuing DEBITS the sender's own token ledger and mints a separate,
 * fixed, single-use discount — tokens are never moved to the recipient. The
 * recipient claims it, then a verified merchant redeems it as a bill discount,
 * reusing the same merchant gate as token redemption.
 */
const router = Router();

/** Roles that may drive a merchant-side redemption (mirrors routes/redemption). */
const MERCHANT_ROLES = ['merchant', 'advertiser', 'admin'];

router.use(authMiddleware);

function serialize(v: Record<string, any>, viewerId: string) {
  return {
    id: String(v._id),
    code: v.code,
    amount_tokens: v.amount_tokens,
    amount: v.amount,
    status: v.status,
    message: v.message || '',
    direction: String(v.issuer_id) === viewerId ? 'sent' : 'received',
    expires_at: v.expires_at,
    claimed_at: v.claimed_at,
    redeemed_at: v.redeemed_at,
    created_at: v.created_at,
  };
}

/**
 * POST /vouchers — issue a voucher, funded by debiting the caller's own tokens.
 * The debit and the mint are kept consistent: if the mint fails after the debit,
 * the debit is reversed (env-safe compensation; the test Mongo has no txns).
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tokens = Math.floor(Number(req.body?.amount_tokens));
    if (!Number.isFinite(tokens) || tokens < 1) {
      res.status(400).json({ success: false, message: 'amount_tokens must be a positive integer' });
      return;
    }
    if (tokens > VOUCHER_MAX_TOKENS) {
      res.status(400).json({ success: false, message: `A voucher may carry at most ${VOUCHER_MAX_TOKENS} tokens` });
      return;
    }

    const value = round2(tokens * TOKEN_VALUE);
    const balance = await spendableBalance(userId);
    if (balance < value) {
      res.status(409).json({ success: false, message: 'Insufficient token balance to fund this voucher' });
      return;
    }

    // Debit the issuer's ledger (this is what makes it NOT a token transfer).
    const debit = await Reward.create({
      user_id: new Types.ObjectId(userId),
      amount: -value,
      status: 'paid',
      type: 'voucher_issue',
      note: `Issued a ${tokens}-token discount voucher`,
    });

    // Guard the concurrent-overdraw race: if the balance is now negative, two
    // issues raced — reverse this debit and refuse.
    if ((await spendableBalance(userId)) < 0) {
      await Reward.deleteOne({ _id: debit._id }).catch(() => {});
      res.status(409).json({ success: false, message: 'Insufficient token balance to fund this voucher' });
      return;
    }

    const expires = new Date();
    expires.setDate(expires.getDate() + VOUCHER_TTL_DAYS);

    let voucher;
    try {
      voucher = await DiscountVoucher.create({
        issuer_id: new Types.ObjectId(userId),
        amount_tokens: tokens,
        amount: value,
        code: await generateVoucherCode(),
        funding_reward_id: debit._id,
        status: 'issued',
        message: String(req.body?.message ?? '').trim().slice(0, 200),
        expires_at: expires,
      });
    } catch (err: any) {
      // Mint failed — give the tokens back.
      await Reward.deleteOne({ _id: debit._id }).catch(() => {});
      throw err;
    }

    res.status(201).json(success(serialize(voucher.toObject(), userId), 'Voucher created'));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** GET /vouchers — vouchers the caller sent or received. */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const oid = new Types.ObjectId(userId);
    const rows = await DiscountVoucher.find({ $or: [{ issuer_id: oid }, { recipient_id: oid }] })
      .sort({ created_at: -1 })
      .limit(100)
      .lean();
    const items = rows.map((v) => serialize(v, userId));
    res.json(
      success({
        sent: items.filter((i) => i.direction === 'sent'),
        received: items.filter((i) => i.direction === 'received'),
      })
    );
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** GET /vouchers/code/:code — preview a voucher before claiming it. */
router.get('/code/:code', async (req: Request, res: Response) => {
  try {
    const code = String(req.params.code).trim().toUpperCase();
    const voucher = await DiscountVoucher.findOne({ code }).lean();
    if (!voucher) {
      res.status(404).json({ success: false, message: 'Voucher not found' });
      return;
    }
    const issuer = await User.findById(voucher.issuer_id).select('name').lean();
    res.json(
      success({
        amount_tokens: voucher.amount_tokens,
        amount: voucher.amount,
        status: voucher.status,
        message: voucher.message || '',
        from: issuer?.name || 'A DAADD user',
        expires_at: voucher.expires_at,
        expired: voucher.expires_at <= new Date(),
      })
    );
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** POST /vouchers/claim — the recipient takes ownership of an issued voucher. */
router.post('/claim', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const code = String(req.body?.code ?? '').trim().toUpperCase();
    if (!code) {
      res.status(400).json({ success: false, message: 'code is required' });
      return;
    }

    const voucher = await DiscountVoucher.findOne({ code });
    if (!voucher) {
      res.status(404).json({ success: false, message: 'Voucher not found' });
      return;
    }
    if (String(voucher.issuer_id) === userId) {
      res.status(400).json({ success: false, message: 'You cannot claim your own voucher' });
      return;
    }
    if (voucher.expires_at <= new Date()) {
      res.status(410).json({ success: false, message: 'This voucher has expired' });
      return;
    }

    // Atomic issued → claimed; only one claimer can win.
    const claimed = await DiscountVoucher.findOneAndUpdate(
      { _id: voucher._id, status: 'issued' },
      { $set: { status: 'claimed', recipient_id: new Types.ObjectId(userId), claimed_at: new Date() } },
      { new: true }
    );
    if (!claimed) {
      res.status(409).json({ success: false, message: 'This voucher can no longer be claimed' });
      return;
    }

    await Notification.create({
      user_id: claimed.issuer_id,
      type: 'reward',
      title: 'Voucher claimed',
      message: `Your ${claimed.amount_tokens}-token gift was claimed.`,
    }).catch(() => {});

    res.json(success(serialize(claimed.toObject(), userId), 'Voucher claimed'));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /vouchers/redeem — a verified merchant redeems a claimed voucher the
 * holder presents (as a QR of its code). The discount was pre-funded at issue,
 * so no token ledger write happens here; the voucher just flips to redeemed.
 */
router.post('/redeem', async (req: Request, res: Response) => {
  try {
    // Only a merchant-side actor may redeem — an end user cannot self-redeem.
    if (!MERCHANT_ROLES.includes(req.user!.role)) {
      res.status(403).json({ success: false, message: 'Merchant access required' });
      return;
    }
    // Same gate as token redemption: a `merchant`-role actor must be verified.
    const verification = await MerchantVerification.findOne({ merchant_id: req.user!.userId })
      .select('status')
      .lean();
    const gate = merchantGate({ role: req.user!.role as UserRole, status: verification?.status ?? null });
    if (!gate.can_transact) {
      res.status(403).json({ success: false, message: gate.reason });
      return;
    }

    const code = String(req.body?.code ?? '').trim().toUpperCase();
    if (!code) {
      res.status(400).json({ success: false, message: 'code is required' });
      return;
    }
    const purchaseAmount = req.body?.purchase_amount != null ? Number(req.body.purchase_amount) : null;

    const voucher = await DiscountVoucher.findOne({ code });
    if (!voucher) {
      res.status(404).json({ success: false, message: 'Voucher not found' });
      return;
    }
    if (voucher.status !== 'claimed') {
      res.status(409).json({ success: false, message: `Voucher is ${voucher.status}` });
      return;
    }
    if (voucher.expires_at <= new Date()) {
      res.status(410).json({ success: false, message: 'This voucher has expired' });
      return;
    }

    // The discount can never exceed the bill (no cash back, no negative total).
    const discount =
      purchaseAmount != null && purchaseAmount >= 0
        ? round2(Math.min(voucher.amount, purchaseAmount))
        : round2(voucher.amount);

    // Atomic claimed → redeemed; only one merchant can win.
    const redeemed = await DiscountVoucher.findOneAndUpdate(
      { _id: voucher._id, status: 'claimed' },
      { $set: { status: 'redeemed', merchant_id: new Types.ObjectId(req.user!.userId), redeemed_at: new Date() } },
      { new: true }
    );
    if (!redeemed) {
      res.status(409).json({ success: false, message: 'Voucher is no longer redeemable' });
      return;
    }

    const finalAmount = purchaseAmount != null && purchaseAmount >= 0 ? round2(purchaseAmount - discount) : null;

    // Tell the holder their voucher was used.
    if (redeemed.recipient_id) {
      await Notification.create({
        user_id: redeemed.recipient_id,
        type: 'reward',
        title: 'Voucher redeemed',
        message: `Your voucher gave a $${discount.toFixed(2)} discount.`,
      }).catch(() => {});
    }

    res.json(
      success({
        voucher_id: String(redeemed._id),
        discount,
        original_amount: purchaseAmount,
        final_amount: finalAmount,
        amount_tokens: redeemed.amount_tokens,
      })
    );
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
