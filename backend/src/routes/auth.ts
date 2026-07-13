import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models';
import { authMiddleware, generateToken } from '../middleware/auth';
import { success } from '../utils/response';
import { sendOtpEmail, sendPasswordResetEmail } from '../services/mailer';

const router = Router();

function sanitizeUser(user: InstanceType<typeof User>) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar_url: user.avatar_url,
    created_at: user.created_at,
  };
}

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email and password are required' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role: role || 'end_user',
      avatar_url: `https://i.pravatar.cc/150?u=${email.toLowerCase()}`,
    });

    const token = generateToken({ userId: user._id.toString(), email: user.email, role: user.role });
    res.status(201).json(success({ user: sanitizeUser(user), token }, 'Registration successful'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const token = generateToken({ userId: user._id.toString(), email: user.email, role: user.role });
    res.json(success({ user: sanitizeUser(user), token }, 'Login successful'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Login failed' });
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json(success(sanitizeUser(user)));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch user' });
  }
});

router.patch('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, avatar_url, preferences } = req.body;
    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (preferences !== undefined) updates.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { $set: updates },
      { new: true }
    );
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json(success(sanitizeUser(user), 'Profile updated'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update profile' });
  }
});

router.patch('/change-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Current and new passwords are required' });
      return;
    }

    const user = await User.findById(req.user!.userId);
    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      res.status(401).json({ success: false, message: 'Current password is incorrect' });
      return;
    }

    user.password_hash = bcrypt.hashSync(newPassword, 10);
    await user.save();
    res.json(success(null, 'Password updated successfully'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update password' });
  }
});

const ageVerificationCodes = new Map<string, { code: string; expiresAt: number }>();
const AGE_VERIFY_TTL_MS = 5 * 60 * 1000;

router.post('/age-verify/request', authMiddleware, async (req: Request, res: Response) => {
  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    ageVerificationCodes.set(req.user!.userId, {
      code,
      expiresAt: Date.now() + AGE_VERIFY_TTL_MS,
    });
    // Deliver the OTP by email when a mail provider is configured
    // (fire-and-forget; never blocks the response).
    if (process.env.RESEND_API_KEY) {
      void sendOtpEmail(req.user!.email, code).catch(() => {});
    }
    res.json(
      success({
        sent: true,
        ...(process.env.NODE_ENV !== 'production' && !process.env.RESEND_API_KEY
          ? { dev_code: code }
          : {}),
      })
    );
  } catch (err: any) {
    res
      .status(500)
      .json({ success: false, message: err.message || 'Failed to send verification code' });
  }
});

router.post('/age-verify/confirm', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ success: false, message: 'Code is required' });
      return;
    }

    const entry = ageVerificationCodes.get(req.user!.userId);
    if (!entry || entry.expiresAt < Date.now()) {
      ageVerificationCodes.delete(req.user!.userId);
      res.status(400).json({ success: false, message: 'Verification code missing or expired' });
      return;
    }
    if (entry.code !== String(code)) {
      res.status(400).json({ success: false, message: 'Invalid verification code' });
      return;
    }

    ageVerificationCodes.delete(req.user!.userId);

    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    user.age_verified = true;
    await user.save();

    res.json(success({ verified: true }));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to verify age' });
  }
});

const passwordResetTokens = new Map<string, { userId: string; expiresAt: number }>();
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (email) {
      const user = await User.findOne({ email: String(email).toLowerCase() });
      if (user) {
        const token = crypto.randomBytes(32).toString('hex');
        passwordResetTokens.set(token, {
          userId: user._id.toString(),
          expiresAt: Date.now() + RESET_TOKEN_TTL_MS,
        });
        // Send the reset link by email when a mail provider is configured
        // (fire-and-forget; never blocks the response).
        if (process.env.RESEND_API_KEY) {
          const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${token}`;
          void sendPasswordResetEmail(user.email, resetUrl).catch(() => {});
        }
        res.json(
          success({
            sent: true,
            ...(process.env.NODE_ENV !== 'production' && !process.env.RESEND_API_KEY
              ? { dev_reset_token: token }
              : {}),
          })
        );
        return;
      }
    }
    res.json(success({ sent: true }));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to process request' });
  }
});

router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ success: false, message: 'Token and new password are required' });
      return;
    }
    if (String(newPassword).length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
      return;
    }

    const entry = passwordResetTokens.get(String(token));
    if (!entry || entry.expiresAt < Date.now()) {
      passwordResetTokens.delete(String(token));
      res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
      return;
    }

    const user = await User.findById(entry.userId);
    if (!user) {
      passwordResetTokens.delete(String(token));
      res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
      return;
    }

    user.password_hash = bcrypt.hashSync(newPassword, 10);
    await user.save();
    passwordResetTokens.delete(String(token));

    res.json(success({ reset: true }, 'Password updated'));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to reset password' });
  }
});

export default router;
