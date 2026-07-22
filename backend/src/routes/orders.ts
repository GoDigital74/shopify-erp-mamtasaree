import { Router, type Request, type Response } from 'express';
import prisma from '../prisma';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        orderItems: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });
    res.status(200).json(orders);
  } catch (error) {
    console.error('Failed to fetch orders from DB:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

export default router;
