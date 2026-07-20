import { io, Socket } from 'socket.io-client';

// The REST base is `<origin>/api/v1`; the socket server shares the origin.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
const SOCKET_URL = API_URL.replace(/\/api\/v1\/?$/, '');

let socket: Socket | null = null;

/**
 * A single shared socket authenticated with the current access token. The auth
 * callback re-reads the token on every (re)connect so a refreshed token is used
 * automatically. Returns null when the user is not logged in.
 */
export function getSocket(): Socket | null {
  if (!localStorage.getItem('daadd_token')) return null;
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: (cb) => cb({ token: localStorage.getItem('daadd_token') || '' }),
      transports: ['websocket'],
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
