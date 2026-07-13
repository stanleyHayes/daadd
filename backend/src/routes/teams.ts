import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { TeamMember, TeamAuditLog, Campaign, User } from '../models';
import { authMiddleware } from '../middleware/auth';
import { success } from '../utils/response';
import { sendTeamInviteEmail } from '../services/mailer';

const router = Router();

const VALID_ROLES = ['viewer', 'editor', 'admin'];

function serializeMember(m: any) {
  return {
    id: m._id?.toString() || m.id,
    user_id: m.user_id?.toString() || '',
    name: m.name || '',
    email: m.email,
    role: m.role,
    status: m.status,
    avatar_url: m.avatar_url,
    joined_at: m.created_at,
  };
}

function serializeAuditLog(l: any) {
  return {
    id: l._id?.toString() || l.id,
    user_name: l.user_name || '',
    action: l.action,
    field: l.field || '',
    old_value: l.old_value || '',
    new_value: l.new_value || '',
    timestamp: l.timestamp,
  };
}

async function logTeamAction(
  campaignId: string,
  userName: string,
  action: string,
  field: string,
  oldValue: string,
  newValue: string
) {
  await TeamAuditLog.create({
    campaign_id: campaignId,
    user_name: userName,
    action,
    field,
    old_value: oldValue,
    new_value: newValue,
  });
}

// List team members for a campaign (owner is synthesized as admin)
router.get('/campaign/:campaignId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;

    const members = await TeamMember.find({ campaign_id: campaignId }).sort({ created_at: 1 }).lean();
    const result: any[] = members.map(serializeMember);

    // Synthesize the campaign owner as an admin member
    if (Types.ObjectId.isValid(campaignId)) {
      const campaign = await Campaign.findById(campaignId).lean();
      if (campaign) {
        const ownerId = campaign.owner?.toString() || '';
        const alreadyListed = members.some((m: any) => m.user_id?.toString() === ownerId);
        if (ownerId && !alreadyListed) {
          let ownerName = 'Campaign Owner';
          let ownerEmail = '';
          const ownerQuery = Types.ObjectId.isValid(ownerId)
            ? { $or: [{ _id: ownerId }, { _id: new Types.ObjectId(ownerId) }] }
            : { _id: ownerId };
          const owner = await User.findOne(ownerQuery as any).lean();
          if (owner) {
            ownerName = owner.name || ownerName;
            ownerEmail = owner.email || '';
          } else if (req.user && ownerId === req.user.userId) {
            ownerName = req.user.email.split('@')[0];
            ownerEmail = req.user.email;
          }
          result.unshift({
            id: `owner-${ownerId}`,
            user_id: ownerId,
            name: ownerName,
            email: ownerEmail,
            role: 'admin',
            status: 'active',
            joined_at: campaign.created_at,
          });
        }
      }
    }

    res.json(success(result));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch team members' });
  }
});

// Invite a team member
router.post('/invite', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { email, role, campaign_id } = req.body as {
      email?: string;
      role?: string;
      campaign_id?: string;
    };

    if (!email || !campaign_id) {
      res.status(400).json({ success: false, message: 'email and campaign_id are required' });
      return;
    }
    if (role && !VALID_ROLES.includes(role)) {
      res.status(400).json({ success: false, message: `role must be one of: ${VALID_ROLES.join(', ')}` });
      return;
    }

    const existing = await TeamMember.findOne({ campaign_id, email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ success: false, message: 'Member already invited to this campaign' });
      return;
    }

    const invitedUser = await User.findOne({ email: email.toLowerCase() }).lean();

    const member = await TeamMember.create({
      campaign_id,
      email,
      name: invitedUser?.name || email.split('@')[0],
      user_id: invitedUser?._id,
      role: (role || 'viewer') as any,
      status: (invitedUser ? 'active' : 'invited') as any,
      invited_by: req.user!.userId,
    });

    await logTeamAction(
      campaign_id,
      req.user!.email,
      'Invited team member',
      'role',
      '',
      `${email} (${role || 'viewer'})`
    );

    // Send the invitation email (fire-and-forget; never blocks the response).
    void sendTeamInviteEmail(email.toLowerCase(), req.user!.email, role || 'viewer').catch(() => {});

    res.status(201).json(success(serializeMember(member.toObject()), 'Invitation sent'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to invite member' });
  }
});

// Update a member's role
router.patch('/:memberId/role', authMiddleware, async (req: Request, res: Response) => {
  try {
    const memberId = req.params.memberId as string;
    const { role } = req.body as { role?: string };
    if (!role || !VALID_ROLES.includes(role)) {
      res.status(400).json({ success: false, message: `role must be one of: ${VALID_ROLES.join(', ')}` });
      return;
    }
    if (!Types.ObjectId.isValid(memberId)) {
      res.status(400).json({ success: false, message: 'Invalid member id' });
      return;
    }

    const member = await TeamMember.findById(memberId);
    if (!member) {
      res.status(404).json({ success: false, message: 'Team member not found' });
      return;
    }

    const oldRole = member.role;
    member.role = role as any;
    await member.save();

    await logTeamAction(
      member.campaign_id,
      req.user!.email,
      'Changed member role',
      member.email,
      oldRole,
      role
    );

    res.json(success(serializeMember(member.toObject()), 'Role updated'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update role' });
  }
});

// Remove a team member
router.delete('/:memberId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const memberId = req.params.memberId as string;
    if (!Types.ObjectId.isValid(memberId)) {
      res.status(400).json({ success: false, message: 'Invalid member id' });
      return;
    }

    const member = await TeamMember.findByIdAndDelete(memberId).lean();
    if (!member) {
      res.status(404).json({ success: false, message: 'Team member not found' });
      return;
    }

    await logTeamAction(
      member.campaign_id,
      req.user!.email,
      'Removed team member',
      member.email,
      member.role,
      ''
    );

    res.json(success(null, 'Member removed'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to remove member' });
  }
});

// Team audit log for a campaign
router.get('/audit-log/:campaignId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;
    const logs = await TeamAuditLog.find({ campaign_id: campaignId }).sort({ timestamp: -1 }).lean();
    res.json(success(logs.map(serializeAuditLog)));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch team audit log' });
  }
});

export default router;
