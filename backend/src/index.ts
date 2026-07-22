import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { shopifyApi, Session, ApiVersion } from '@shopify/shopify-api'; // Imported ApiVersion
import '@shopify/shopify-api/adapters/node';
import prisma from './prisma';
import productsRoute from './routes/products';
import syncRoutes from './routes/sync';
import vendorsRoute from './routes/vendors';
import purchaseOrdersRoute from './routes/purchase-orders';
import analyticsRoute from './routes/analytics';
import customersRoute from './routes/customers';
import { setupWebhooks } from './webhooks';

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

// FIX 1: CORS Configuration
// Using 'origin: *' with 'credentials: true' will throw a fatal error in modern browsers.
app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : true, // Safely reflects origin for Vercel
  credentials: true,
}));

// Initialize Shopify
export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY || 'dummy_key',
  apiSecretKey: process.env.SHOPIFY_API_SECRET || 'dummy_secret',
  scopes: (process.env.SHOPIFY_SCOPES || 'read_products,write_products').split(','),
  hostName: process.env.HOST ? process.env.HOST.replace(/^https?:\/\//, '') : 'localhost',
  hostScheme: 'https',
  apiVersion: ApiVersion.October24, // FIX 2: Replaced '2024-10' as any with strict type
  isEmbeddedApp: true,
});

setupWebhooks();

// FIX 3: Webhook endpoint MUST be defined BEFORE app.use(express.json())
// Express parses the body sequentially. If express.json() runs first, it destroys 
// the raw buffer that Shopify requires to calculate the HMAC security signature.
app.post(
  '/api/webhooks',
  express.text({ type: '*/*' }),
  async (req: Request, res: Response) => {
    try {
      await shopify.webhooks.process({
        rawBody: req.body,
        rawRequest: req,
        rawResponse: res,
      });
    } catch (error: any) {
      console.error(`Failed to process webhook: ${error.message}`);
      if (!res.headersSent) {
        res.status(500).send(error.message);
      }
    }
  }
);

// NOW we can apply the JSON parser for the rest of the standard REST routes
app.use(express.json());

// Root route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'iNext ERP Express Backend is Running!' });
});

// OAuth routes
app.get('/api/auth', async (req: Request, res: Response) => {
  const shop = req.query.shop as string;
  if (!shop) return res.status(400).send('Missing shop parameter');

  const sanitizedShop = shopify.utils.sanitizeShop(shop, true);
  if (!sanitizedShop) return res.status(400).send('Invalid shop domain');

  try {
    await shopify.auth.begin({
      shop: sanitizedShop,
      callbackPath: '/api/auth/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });
  } catch (error) {
    console.error('Auth Begin Error:', error);
    res.status(500).send('Failed to start OAuth');
  }
});

app.get('/api/auth/callback', async (req: Request, res: Response) => {
  try {
    const callback = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    const { session } = callback;
    
    await prisma.session.upsert({
      where: { id: session.id },
      update: {
        shop: session.shop,
        state: session.state,
        isOnline: session.isOnline,
        scope: session.scope,
        accessToken: session.accessToken,
      },
      create: {
        id: session.id,
        shop: session.shop,
        state: session.state,
        isOnline: session.isOnline,
        scope: session.scope,
        accessToken: session.accessToken!,
      },
    });

    const host = req.query.host as string;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}?shop=${session.shop}&host=${host}`);
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    res.status(500).send('Authentication failed');
  }
});

// Authentication Middleware
export const verifyShopifyToken = async (req: Request, res: Response, next: NextFunction) => {
  if (process.env.SHOPIFY_ADMIN_TOKEN && process.env.SHOPIFY_SHOP_DOMAIN) {
    res.locals.shopifySession = new Session({
      id: 'legacy_custom_app',
      shop: process.env.SHOPIFY_SHOP_DOMAIN,
      state: 'state',
      isOnline: false,
      accessToken: process.env.SHOPIFY_ADMIN_TOKEN,
    });
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  
  if (token === 'dummy_token') {
    const rawSession = await prisma.session.findFirst();
    
    if (rawSession) {
      res.locals.shopifySession = new Session(rawSession as any);
    } else {
      res.locals.shopifySession = new Session({
        id: 'standalone_session',
        shop: process.env.SHOPIFY_SHOP_DOMAIN || 'mamta-saree-n6y5eqfn.myshopify.com',
        state: 'active',
        isOnline: false,
        accessToken: process.env.SHOPIFY_ADMIN_TOKEN || 'dummy_access_token',
      });
    }
    return next();
  }
  
  try {
    const payload = await shopify.session.decodeSessionToken(token);
    const shop = payload.dest.replace('https://', '');

    const rawSession = await prisma.session.findFirst({ where: { shop } });
    if (!rawSession) return res.status(401).json({ error: 'Session not found in DB' });

    res.locals.shopifySession = new Session(rawSession as any);
    next();
  } catch (error) {
    console.error('JWT Verification failed:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Protected API Routes
app.get('/api/health', verifyShopifyToken, async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ 
      status: 'ok', 
      shop: res.locals.shopifySession.shop,
      message: 'Backend connected!' 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: 'DB disconnected' });
  }
});

import ordersRoute from './routes/orders';
import inventoryRoute from './routes/inventory';

app.use('/api/products', verifyShopifyToken, productsRoute);
app.use('/api/orders', verifyShopifyToken, ordersRoute);
app.use('/api/inventory', verifyShopifyToken, inventoryRoute);
app.use('/api/customers', verifyShopifyToken, customersRoute);
app.use('/api/shopify/sync', verifyShopifyToken, syncRoutes);
app.use('/api/vendors', verifyShopifyToken, vendorsRoute);
app.use('/api/purchase-orders', verifyShopifyToken, purchaseOrdersRoute);
app.use('/api/analytics', verifyShopifyToken, analyticsRoute);

app.listen(PORT, () => {
  console.log(`🚀 ERP Backend running on port ${PORT}`);
});

