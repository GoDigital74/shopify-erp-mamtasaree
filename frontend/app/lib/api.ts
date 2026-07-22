declare global {
  interface Window {
    shopify?: {
      idToken: () => Promise<string>;
    };
  }
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export async function authenticatedFetch(endpoint: string, options: RequestInit = {}) {
  // Use the backdoor token to authenticate when running outside Shopify admin
  let token = 'dummy_token'; 

  // Attempt to get session token from Shopify App Bridge ONLY if embedded
  if (typeof window !== 'undefined' && window.shopify?.idToken) {
    try {
      token = await window.shopify.idToken();
    } catch (err) {
      console.warn('Not running inside Shopify iframe, using standalone mode.');
    }
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
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