import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import { getToken } from './storage';

// Mirror api.ts host resolution; the socket server shares the REST origin.
const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://${DEFAULT_HOST}:4000/api/v1`;
const SOCKET_URL = API_URL.replace(/\/api\/v1\/?$/, '');

let socket: Socket | null = null;

/** A single shared socket authenticated with the stored access token. */
export async function getSocket(): Promise<Socket | null> {
  const token = await getToken();
  if (!token) return null;
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
