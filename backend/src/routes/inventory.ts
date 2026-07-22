import { Router, type Request, type Response } from 'express';
import prisma from '../prisma';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        variant: {
          include: {
            product: true
          }
        }
      },
      take: 50
    });
    res.status(200).json(inventory);
  } catch (error) {
    console.error('Failed to fetch inventory from DB:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

export default router;
