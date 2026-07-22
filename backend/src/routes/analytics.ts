import { Router, type Request, type Response } from 'express';
import prisma from '../prisma';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // Basic Sales Analytics
    const orders = await prisma.order.findMany({
      where: { status: { not: 'cancelled' } } // simplified condition
    });
    
    const totalSales = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const orderCount = orders.length;

    // Inventory Analytics: Get low stock items
    const lowStockThreshold = 10;
    const lowStockItems = await prisma.inventory.findMany({
      where: {
        quantity: { lte: lowStockThreshold }
      },
      include: {
        variant: {
          include: {
            product: true
          }
        }
      }
    });

    res.status(200).json({
      sales: {
        total: totalSales,
        count: orderCount
      },
      inventory: {
        lowStockItems
      }
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
