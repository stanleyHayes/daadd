import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import type { Server } from 'socket.io';
import { Conversation, Message, User, Ad, Campaign } from '../models';
import { authMiddleware } from '../middleware/auth';
import { success, paginated } from '../utils/response';

const router = Router();

// Users that may be messaged as a "company" (i.e. not other customers).
const isCompanyRole = (role?: string) => !!role && role !== 'end_user';

function toObjectId(id: string | string[] | undefined): Types.ObjectId | null {
  if (typeof id !== 'string') return null;
  try {
    return new Types.ObjectId(id);
  } catch {
    return null;
  }
}

function serializeMessage(m: any) {
  return {
    id: String(m._id),
    conversation_id: String(m.conversation_id),
    sender_id: String(m.sender_id),
    body: m.body,
    created_at: m.created_at,
  };
}

/** The caller's role within a conversation, or null if they are not a participant. */
function participantSlot(conversation: any, userId: string): 'customer' | 'advertiser' | null {
  if (String(conversation.customer_id) === userId) return 'customer';
  if (String(conversation.advertiser_id) === userId) return 'advertiser';
  return null;
}

/** Push a new message to both participants' personal rooms (multi-device sync). */
function emitMessage(req: Request, conversation: any, message: any) {
  const io = req.app.get('io') as Server | undefined;
  if (!io) return;
  const payload = { conversationId: String(conversation._id), message: serializeMessage(message) };
  for (const uid of [conversation.customer_id, conversation.advertiser_id]) {
    io.to(`user:${String(uid)}`).emit('message:new', payload);
  }
}

/**
 * Start (or fetch the existing) conversation with an advertiser and post the
 * first message. Idempotent per (customer, advertiser) — the unique index makes
 * "one thread per company" true even under concurrent starts.
 */
router.post('/conversations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { advertiser_id, ad_id, campaign_id, body } = req.body;

    const advertiserId = toObjectId(advertiser_id);
    if (!advertiserId) {
      res.status(400).json({ success: false, message: 'A valid advertiser_id is required' });
      return;
    }
    if (String(advertiserId) === userId) {
      res.status(400).json({ success: false, message: 'You cannot message yourself' });
      return;
    }
    const text = typeof body === 'string' ? body.trim() : '';
    if (!text) {
      res.status(400).json({ success: false, message: 'Message body is required' });
      return;
    }

    // Only real company accounts can be messaged (not other customers).
    const advertiser = await User.findById(advertiserId).select('role name avatar_url').lean();
    if (!advertiser || !isCompanyRole(advertiser.role)) {
      res.status(404).json({ success: false, message: 'Advertiser not found' });
      return;
    }

    // Only tag the thread with an ad/campaign that genuinely belongs to the
    // messaged advertiser — a customer must not tag a competitor's ad. Invalid
    // tags are dropped (not hard-failed) so the enquiry still goes through.
    const adObjectId = toObjectId(ad_id);
    const campaignObjectId = toObjectId(campaign_id);
    let taggedCampaign: Types.ObjectId | undefined;
    let taggedAd: Types.ObjectId | undefined;
    if (campaignObjectId) {
      const owned = await Campaign.findOne({ _id: campaignObjectId, owner: advertiserId })
        .select('_id')
        .lean();
      if (owned) taggedCampaign = campaignObjectId;
    }
    if (adObjectId) {
      const ad = await Ad.findById(adObjectId).select('campaign_id').lean();
      if (ad) {
        const owned = await Campaign.findOne({ _id: ad.campaign_id, owner: advertiserId })
          .select('_id')
          .lean();
        if (owned) taggedAd = adObjectId;
      }
    }

    // Upsert the single thread for this pair. Retry once on a duplicate-key race.
    let conversation;
    try {
      conversation = await Conversation.findOneAndUpdate(
        { customer_id: new Types.ObjectId(userId), advertiser_id: advertiserId },
        {
          $setOnInsert: {
            customer_id: new Types.ObjectId(userId),
            advertiser_id: advertiserId,
            ...(taggedAd ? { ad_id: taggedAd } : {}),
            ...(taggedCampaign ? { campaign_id: taggedCampaign } : {}),
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    } catch (err: any) {
      if (err?.code === 11000) {
        conversation = await Conversation.findOne({
          customer_id: new Types.ObjectId(userId),
          advertiser_id: advertiserId,
        });
      } else {
        throw err;
      }
    }

    const message = await Message.create({
      conversation_id: conversation!._id,
      sender_id: new Types.ObjectId(userId),
      body: text,
    });

    conversation!.last_message = text;
    conversation!.last_message_at = message.created_at;
    conversation!.customer_last_read = message.created_at; // sender has read their own message
    await conversation!.save();

    emitMessage(req, conversation, message);

    res.status(201).json(
      success({ conversation_id: String(conversation!._id), message: serializeMessage(message) }, 'Conversation started')
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to start conversation' });
  }
});

/** List the caller's conversations (either role) with counterpart + unread count. */
router.get('/conversations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const uid = new Types.ObjectId(userId);

    const conversations = await Conversation.find({
      $or: [{ customer_id: uid }, { advertiser_id: uid }],
    })
      .sort({ last_message_at: -1, updated_at: -1 })
      .lean();

    // Counterpart profiles in one query.
    const counterpartIds = conversations.map((c) =>
      String(c.customer_id) === userId ? c.advertiser_id : c.customer_id
    );
    const users = await User.find({ _id: { $in: counterpartIds } })
      .select('name avatar_url role')
      .lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));

    // Unread = messages after my last_read not sent by me.
    const items = await Promise.all(
      conversations.map(async (c) => {
        const slot = String(c.customer_id) === userId ? 'customer' : 'advertiser';
        const lastRead = slot === 'customer' ? c.customer_last_read : c.advertiser_last_read;
        const unread = await Message.countDocuments({
          conversation_id: c._id,
          sender_id: { $ne: uid },
          ...(lastRead ? { created_at: { $gt: lastRead } } : {}),
        });
        const other = byId.get(String(slot === 'customer' ? c.advertiser_id : c.customer_id));
        return {
          id: String(c._id),
          role: slot,
          counterpart: {
            id: String(slot === 'customer' ? c.advertiser_id : c.customer_id),
            name: other?.name || 'User',
            avatar_url: other?.avatar_url || '',
            role: other?.role || '',
          },
          ad_id: c.ad_id ? String(c.ad_id) : null,
          campaign_id: c.campaign_id ? String(c.campaign_id) : null,
          last_message: c.last_message || '',
          last_message_at: c.last_message_at || null,
          unread,
        };
      })
    );

    res.json(success(items));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch conversations' });
  }
});

/** Fetch a thread's messages (paginated) and mark it read for the caller. */
router.get('/conversations/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const convId = toObjectId(req.params.id);
    if (!convId) {
      res.status(400).json({ success: false, message: 'Invalid conversation id' });
      return;
    }
    const conversation = await Conversation.findById(convId);
    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }
    const slot = participantSlot(conversation, userId);
    if (!slot) {
      res.status(403).json({ success: false, message: 'Not a participant in this conversation' });
      return;
    }

    const { page = '1', limit = '50' } = req.query as Record<string, string | undefined>;
    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit || '50', 10)));

    const total = await Message.countDocuments({ conversation_id: convId });
    // Newest page first from the DB, returned oldest→newest for display.
    const found = await Message.find({ conversation_id: convId })
      .sort({ created_at: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();
    const messages = found.reverse().map(serializeMessage);

    // Mark read for the caller.
    conversation.set(slot === 'customer' ? 'customer_last_read' : 'advertiser_last_read', new Date());
    await conversation.save();

    res.json(paginated(messages, total, pageNum, limitNum));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch messages' });
  }
});

/** Reply in an existing thread. */
router.post('/conversations/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const convId = toObjectId(req.params.id);
    if (!convId) {
      res.status(400).json({ success: false, message: 'Invalid conversation id' });
      return;
    }
    const text = typeof req.body.body === 'string' ? req.body.body.trim() : '';
    if (!text) {
      res.status(400).json({ success: false, message: 'Message body is required' });
      return;
    }
    const conversation = await Conversation.findById(convId);
    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }
    const slot = participantSlot(conversation, userId);
    if (!slot) {
      res.status(403).json({ success: false, message: 'Not a participant in this conversation' });
      return;
    }

    const message = await Message.create({
      conversation_id: conversation._id,
      sender_id: new Types.ObjectId(userId),
      body: text,
    });

    conversation.last_message = text;
    conversation.last_message_at = message.created_at;
    conversation.set(slot === 'customer' ? 'customer_last_read' : 'advertiser_last_read', message.created_at);
    await conversation.save();

    emitMessage(req, conversation, message);

    res.status(201).json(success(serializeMessage(message), 'Message sent'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to send message' });
  }
});

/** Mark a thread read for the caller. */
router.post('/conversations/:id/read', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const convId = toObjectId(req.params.id);
    if (!convId) {
      res.status(400).json({ success: false, message: 'Invalid conversation id' });
      return;
    }
    const conversation = await Conversation.findById(convId);
    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }
    const slot = participantSlot(conversation, userId);
    if (!slot) {
      res.status(403).json({ success: false, message: 'Not a participant in this conversation' });
      return;
    }
    conversation.set(slot === 'customer' ? 'customer_last_read' : 'advertiser_last_read', new Date());
    await conversation.save();
    res.json(success({ ok: true }));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to mark read' });
  }
});

export default router;
