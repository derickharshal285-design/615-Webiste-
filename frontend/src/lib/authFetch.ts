/**
 * authFetch — drop-in replacement for fetch() that automatically transmits
 * the auth_token cookie using credentials: 'include'.
 * 
 * Usage:
 *   import { authFetch } from '../lib/authFetch';
 *   const res = await authFetch('/api/orders');
 *   const res = await authFetch('/api/products', { method: 'POST', body: JSON.stringify(data) });
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers: HeadersInit = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}
