import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import { SupportTicket } from '../models';
import { authMiddleware, requireRole, JWT_SECRET, JwtPayload } from '../middleware/auth';
import { success, paginated } from '../utils/response';

const router = Router();

const CATEGORIES = ['general', 'problem', 'fraud', 'campaign', 'merchant', 'billing'] as const;
const STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;

/** Optional auth: attach the user when a valid token is present, never reject. */
function optionalUserId(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET) as JwtPayload;
    return decoded.userId || null;
  } catch {
    return null;
  }
}

/** Static help content backing the Support Centre FAQ. */
const FAQ = [
  {
    q: 'How do I earn tokens?',
    a: 'View adverts, click through, write reviews and upload photos. Each campaign sets its own token rates — check the "What you can earn" panel on any advert, or open the Token Calculator.',
  },
  {
    q: 'What is a token worth?',
    a: 'Tokens convert to a cash discount at checkout. The current rate is shown in the Token Calculator and on your rewards screen.',
  },
  {
    q: 'How do I redeem my tokens?',
    a: 'Open Redeem, pick the branch you are visiting, choose how many tokens to spend, and show the QR code to the cashier. The code expires after about two minutes for your security.',
  },
  {
    q: 'Why was my discount smaller than the tokens I offered?',
    a: 'Each campaign shares a set percentage of your purchase as discount. If that percentage caps out below your token value, only the tokens actually needed are spent — the rest stay in your wallet.',
  },
  {
    q: 'How do I become a VIP?',
    a: 'VIP is automatic and free. Keep visiting merchants, making purchases and leaving genuine reviews — your progress towards each requirement is shown on your profile.',
  },
  {
    q: 'My reward or redemption looks wrong. What do I do?',
    a: 'Report it under "Report a Problem" below with the receipt number if you have one, and the support team will investigate.',
  },
];

/** Public: help content for the Support Centre. */
router.get('/faq', (_req: Request, res: Response) => {
  res.json(success(FAQ));
});

/**
 * Raise a support ticket. Works signed-out (the contact form) and signed-in,
 * in which case the ticket is linked to the account.
 */
router.post('/tickets', async (req: Request, res: Response) => {
  try {
    const { name, email, category, subject, message } = req.body || {};
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanSubject = typeof subject === 'string' ? subject.trim() : '';
    const cleanMessage = typeof message === 'string' ? message.trim() : '';

    if (!cleanEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
      res.status(400).json({ success: false, message: 'A valid email address is required' });
      return;
    }
    if (!cleanSubject || !cleanMessage) {
      res.status(400).json({ success: false, message: 'Subject and message are required' });
      return;
    }

    const userId = optionalUserId(req);
    const ticket = await SupportTicket.create({
      ...(userId ? { user_id: new Types.ObjectId(userId) } : {}),
      name: typeof name === 'string' ? name.trim() : '',
      email: cleanEmail,
      category: CATEGORIES.includes(category) ? category : 'general',
      subject: cleanSubject,
      message: cleanMessage,
    });

    res.status(201).json(success(ticket, 'Support request submitted'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to submit request' });
  }
});

/** The signed-in user's own tickets. */
router.get('/tickets', authMiddleware, async (req: Request, res: Response) => {
  try {
    const tickets = await SupportTicket.find({ user_id: req.user!.userId })
      .sort({ created_at: -1 })
      .limit(50)
      .lean();
    res.json(success(tickets));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch tickets' });
  }
});

/** All tickets, filterable by status/category (admin only). */
router.get('/tickets/all', authMiddleware, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { status, category, page = '1', limit = '20' } = req.query as Record<string, string | undefined>;
    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit || '20', 10)));

    const filter: Record<string, any> = {};
    if (status && STATUSES.includes(status as any)) filter.status = status;
    if (category && CATEGORIES.includes(category as any)) filter.category = category;

    const total = await SupportTicket.countDocuments(filter);
    const tickets = await SupportTicket.find(filter)
      .sort({ created_at: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json(paginated(tickets, total, pageNum, limitNum));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch tickets' });
  }
});

/** Update a ticket's status / add a response (admin only). */
router.patch('/tickets/:id', authMiddleware, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id as string)) {
      res.status(400).json({ success: false, message: 'Invalid ticket id' });
      return;
    }
    const update: Record<string, unknown> = {};
    if (STATUSES.includes(req.body?.status)) update.status = req.body.status;
    if (typeof req.body?.response === 'string') update.response = req.body.response.trim();
    if (!Object.keys(update).length) {
      res.status(400).json({ success: false, message: 'Provide a status and/or response' });
      return;
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }
    res.json(success(ticket, 'Ticket updated'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update ticket' });
  }
});

export default router;
