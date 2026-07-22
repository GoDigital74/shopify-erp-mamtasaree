import { Router, type Request, type Response } from 'express';
import prisma from '../prisma';

const router = Router();

// GET all vendors
router.get('/', async (req: Request, res: Response) => {
  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(vendors);
  } catch (error) {
    console.error('Failed to fetch vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// POST a new vendor
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    
    const vendor = await prisma.vendor.create({
      data: {
        name,
        email
      }
    });

    res.status(201).json(vendor);
  } catch (error) {
    console.error('Failed to create vendor:', error);
    res.status(500).json({ error: 'Failed to create vendor' });
  }
});

export default router;
