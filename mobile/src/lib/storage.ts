import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'adplatform_auth_token';
const REFRESH_TOKEN_KEY = 'adplatform_refresh_token';

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    console.error('Failed to save token');
  }
}

export async function removeToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    console.error('Failed to remove token');
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setRefreshToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } catch {
    console.error('Failed to save refresh token');
  }
}

export async function removeRefreshToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    console.error('Failed to remove refresh token');
  }
}

export async function clearAuth(): Promise<void> {
  await Promise.all([removeToken(), removeRefreshToken()]);
}
