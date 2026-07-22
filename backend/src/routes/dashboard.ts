//new

import { Router, type Request, type Response } from 'express';
import prisma from '../prisma';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const [totalOrders, totalProducts, totalVendors, recentOrders] = await Promise.all([
      prisma.order.count(),
      prisma.product.count(),
      prisma.vendor.count(),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.status(200).json({
      totalOrders,
      totalProducts,
      totalVendors,
      recentOrders
    });
  } catch (error: any) {
    console.error('Failed to fetch dashboard metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;