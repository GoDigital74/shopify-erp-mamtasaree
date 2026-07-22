import { Router, type Request, type Response } from 'express';
import prisma from '../prisma';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // Note: If you want to filter by the session's shop, you can get it from res.locals.shopifySession.shop
    // and find the corresponding Shop record. For this demo, we return all products.
    const products = await prisma.product.findMany({
      include: {
        variants: {
          include: {
            inventory: true
          }
        }
      },
      take: 20
    });
    res.status(200).json(products);
  } catch (error) {
    console.error('Failed to fetch products from DB:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

export default router;
