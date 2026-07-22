import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { shopifyApi, ApiVersion, Session } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';
import prisma from './prisma'; // Imports your database setup from step 1
import productsRoute from './routes/products';
import syncRoutes from './routes/sync';
import vendorsRoute from './routes/vendors';
import purchaseOrdersRoute from './routes/purchase-orders';
import analyticsRoute from './routes/analytics';
import { setupWebhooks } from './webhooks';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.set('trust proxy', 1); // Crucial for secure cookies behind ngrok

// Initialize Shopify
export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SHOPIFY_SCOPES!.split(','),
  hostName: process.env.HOST!.replace(/^https?:\/\//, ''),
  hostScheme: 'https',
  apiVersion: '2024-10' as any,
  isEmbeddedApp: true,
});

setupWebhooks();

// Webhook endpoint (Must use raw body)
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
      // shopify.webhooks.process will automatically send a 200 response if successful
    } catch (error: any) {
      console.error(`Failed to process webhook: ${error.message}`);
      if (!res.headersSent) {
        res.status(500).send(error.message);
      }
    }
  }
);

// ==========================================
// 1. OAUTH FLOW
// ==========================================

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
    console.log('Successfully authenticated shop:', session.shop);
    
    // Save session to Prisma Database
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

    // Register webhooks for this shop
    try {
      await shopify.webhooks.register({ session });
      console.log('Successfully registered webhooks for shop:', session.shop);
    } catch (e) {
      console.error('Failed to register webhooks:', e);
    }

    const host = req.query.host as string;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}?shop=${session.shop}&host=${host}`);
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    res.status(500).send('Authentication failed');
  }
});

// ==========================================
// 2. AUTHENTICATION MIDDLEWARE
// ==========================================

export const verifyShopifyToken = async (req: Request, res: Response, next: NextFunction) => {
  // LEGACY CUSTOM APP MODE:
  // If the user provided a permanent Admin API token in .env, use it directly!
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

  // FALLBACK TO OAUTH/JWT MODE (if no permanent token is provided)
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  
  if (token === 'dummy_token' && process.env.NODE_ENV !== 'production') {
    const rawSession = await prisma.session.findFirst();
    if (!rawSession) return res.status(401).json({ error: 'No test session found' });
    res.locals.shopifySession = new Session(rawSession as any);
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

// ==========================================
// 3. PROTECTED API ROUTES
// ==========================================

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

app.use('/api/products', verifyShopifyToken, productsRoute);
app.use('/api/shopify/sync', verifyShopifyToken, syncRoutes);
app.use('/api/vendors', verifyShopifyToken, vendorsRoute);
app.use('/api/purchase-orders', verifyShopifyToken, purchaseOrdersRoute);
app.use('/api/analytics', verifyShopifyToken, analyticsRoute);

// ==========================================
// 4. START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`🚀 ERP Backend is running on http://localhost:${PORT}`);
});

