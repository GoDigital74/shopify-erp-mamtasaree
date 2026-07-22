import { Router, type Request, type Response } from 'express';
import prisma from '../prisma';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });
    res.status(200).json(customers);
  } catch (error) {
    console.error('Failed to fetch customers from DB:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

export default router;
