/**
 * authFetch — drop-in replacement for fetch() that automatically transmits
 * the auth_token cookie using credentials: 'include'.
 * 
 * Usage:
 *   import { authFetch } from '../lib/authFetch';
 *   const res = await authFetch('/api/orders');
 *   const res = await authFetch('/api/products', { method: 'POST', body: JSON.stringify(data) });
 */
let cachedCsrfToken: string | null = null;

async function getCsrfToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/csrf-token', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      cachedCsrfToken = data.csrfToken;
      return cachedCsrfToken;
    }
  } catch (err) {
    console.error('Failed to fetch CSRF token:', err);
  }
  return null;
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

  if (isStateChanging && !cachedCsrfToken && !url.includes('/api/csrf-token')) {
    await getCsrfToken();
  }

  const makeRequest = async (token: string | null) => {
    const headers: HeadersInit = {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token && isStateChanging ? { 'X-CSRF-Token': token } : {}),
      ...(options.headers as Record<string, string> || {}),
    };

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  };

  let response = await makeRequest(cachedCsrfToken);

  // If forbidden (likely CSRF mismatch or expired), fetch a new token and retry once
  if (response.status === 403 && isStateChanging && !url.includes('/api/csrf-token')) {
    const newToken = await getCsrfToken();
    if (newToken) {
      response = await makeRequest(newToken);
    }
  }

  return response;
}
