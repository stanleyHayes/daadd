import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models';
import { authMiddleware, generateToken } from '../middleware/auth';
import { success } from '../utils/response';

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

export default router;
