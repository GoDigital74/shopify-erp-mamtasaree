// Basic authenticated fetch using the token from Shopify's App Bridge (if embedded)
// or just standard fetch with credentials.
// For the purpose of this Next.js dashboard, we are proxying requests or attaching
// a static test token in development.

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  // In a real Shopify app, you would use App Bridge's getSessionToken() to fetch a token.
  // For development, we'll append standard headers and proxy the request to the Express backend.
  
  // Note: We use relative URLs so that the request hits the Next.js proxy (defined in next.config.ts)
  // which then forwards it to the Express backend. This prevents CORS issues.
  const fullUrl = url;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // If App Bridge is initialized (in an embedded context), get the real token
  let token = 'dummy_token';
  if (typeof window !== 'undefined' && (window as any).shopify) {
    try {
      token = await (window as any).shopify.idToken();
    } catch (e) {
      console.warn('Failed to fetch App Bridge token:', e);
    }
  }

  defaultHeaders['Authorization'] = `Bearer ${token}`;

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  return fetch(fullUrl, config);
}
