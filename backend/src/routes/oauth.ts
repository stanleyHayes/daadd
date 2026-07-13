import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const VALID_PLATFORMS = ['google', 'meta', 'tiktok', 'linkedin', 'pinterest'];

const OAUTH_ENDPOINTS: Record<string, string> = {
  google: 'https://accounts.google.com/o/oauth2/v2/auth',
  meta: 'https://www.facebook.com/v19.0/dialog/oauth',
  tiktok: 'https://www.tiktok.com/v2/auth/authorize',
  linkedin: 'https://www.linkedin.com/oauth/v2/authorization',
  pinterest: 'https://www.pinterest.com/oauth',
};

// Placeholder OAuth start URL. Real OAuth apps are not registered yet, so this
// returns a well-formed authorization URL pointing at each platform's OAuth
// endpoint with placeholder client credentials. The page redirects the browser
// to response.data.authorization_url.
router.get('/authorize/:platform', authMiddleware, (req: Request, res: Response) => {
  const platform = req.params.platform as string;
  if (!VALID_PLATFORMS.includes(platform)) {
    res.status(400).json({
      success: false,
      message: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}`,
    });
    return;
  }

  const base = OAUTH_ENDPOINTS[platform];
  const apiBase = process.env.API_BASE_URL || 'http://localhost:4000';
  const params = new URLSearchParams({
    client_id: process.env[`OAUTH_CLIENT_${platform.toUpperCase()}`] || `placeholder-${platform}-client-id`,
    redirect_uri: `${apiBase}/api/v1/oauth/callback/${platform}`,
    response_type: 'code',
    scope: 'ads_read',
    state: Buffer.from(JSON.stringify({ platform, ts: Date.now() })).toString('base64url'),
  });

  const authorization_url = `${base}?${params.toString()}`;
  res.json({ authorization_url, url: authorization_url });
});

export default router;
