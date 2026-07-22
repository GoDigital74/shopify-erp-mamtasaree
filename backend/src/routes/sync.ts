import { Router, type Request, type Response } from 'express';
import { syncProducts, syncOrders } from '../services/syncService';

const router = Router();

router.post('/products', async (req: Request, res: Response) => {
  const session = res.locals.shopifySession;
  try {
    const result = await syncProducts(session);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error syncing products:', error);
    res.status(500).json({ error: 'Failed to sync products' });
  }
});

router.post('/orders', async (req: Request, res: Response) => {
  const session = res.locals.shopifySession;
  try {
    const result = await syncOrders(session);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error syncing orders:', error);
    res.status(500).json({ error: 'Failed to sync orders' });
  }
});

export default router;
