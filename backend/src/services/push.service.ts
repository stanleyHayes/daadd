import axios from 'axios';
import { User } from '../models';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/** Expo push tokens look like ExponentPushToken[...] / ExpoPushToken[...]. */
function isExpoToken(token: string): boolean {
  return /^Expo(nent)?PushToken\[/.test(token);
}

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Best-effort push notification to all of a user's registered Expo devices.
 * Never throws — a delivery failure must not break the triggering request.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  try {
    const user = await User.findById(userId).select('push_tokens').lean();
    const tokens = (user?.push_tokens || [])
      .map((t) => t.token)
      .filter((t): t is string => !!t && isExpoToken(t));
    if (!tokens.length) return;

    const messages = tokens.map((to) => ({
      to,
      title: payload.title,
      body: payload.body,
      sound: 'default' as const,
      ...(payload.data ? { data: payload.data } : {}),
    }));

    await axios.post(EXPO_PUSH_URL, messages, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 8000,
    });
  } catch (err) {
    console.error('sendPushToUser failed (swallowed):', err);
  }
}
