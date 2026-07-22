declare global {
  interface Window {
    shopify?: {
      idToken: () => Promise<string>;
    };
  }
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export async function authenticatedFetch(endpoint: string, options: RequestInit = {}) {
  let token = '';

  // Get session token from Shopify App Bridge
  if (typeof window !== 'undefined' && window.shopify?.idToken) {
    try {
      token = await window.shopify.idToken();
    } catch (err) {
      console.error('Failed to get App Bridge ID Token:', err);
    }
  }

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Backend request failed with status: ${response.status}`);
  }

  return response.json();
}
