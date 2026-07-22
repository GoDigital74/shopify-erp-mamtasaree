import { Router, type Request, type Response } from 'express';
import prisma from '../prisma';

const router = Router();

// GET all POs
router.get('/', async (req: Request, res: Response) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      include: { vendor: true },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(pos);
  } catch (error) {
    console.error('Failed to fetch purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// POST a new PO
router.post('/', async (req: Request, res: Response) => {
  try {
    const { vendorId, total } = req.body;
    
    const po = await prisma.purchaseOrder.create({
      data: {
        vendorId,
        total: total || 0,
        status: 'draft'
      }
    });

    res.status(201).json(po);
  } catch (error) {
    console.error('Failed to create purchase order:', error);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

// POST receive inventory for a PO
// Since the schema doesn't have PO line items, we receive variants via the request body
router.post('/:id/receive', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { variantId, quantity } = req.body;

    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) return res.status(404).json({ error: 'PO not found' });

    // Update PO status
    await prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'received' }
    });

    // If variant is provided, update local inventory
    if (variantId && quantity) {
      const inventory = await prisma.inventory.upsert({
        where: { variantId },
        update: {
          quantity: { increment: parseInt(quantity, 10) }
        },
        create: {
          variantId,
          quantity: parseInt(quantity, 10)
        }
      });
      
      // In a real application, you would also use the Shopify Admin API to push this
      // inventory change to Shopify (using inventoryAdjustQuantity GraphQL mutation).
      // For this demo, we keep the logic focused on the ERP's local Postgres DB.
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to receive PO:', error);
    res.status(500).json({ error: 'Failed to receive purchase order' });
  }
});

export default router;
