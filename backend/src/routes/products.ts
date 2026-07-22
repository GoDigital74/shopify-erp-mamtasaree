import { Router, type Request, type Response } from 'express';
import prisma from '../prisma';

import { shopify } from '../index';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        variants: {
          include: {
            inventory: true
          }
        }
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(products);
  } catch (error) {
    console.error('Failed to fetch products from DB:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const session = res.locals.shopifySession;
    const { title, description, price, sku, imageUrl, status, vendor, category } = req.body;

    if (!title || !price) {
      return res.status(400).json({ error: 'Title and price are required.' });
    }

    const shopDomain = session.shop as string;
    const accessToken = (Array.isArray(session.accessToken) ? session.accessToken[0] : session.accessToken) as string;

    // ---------------------------------------------------------------
    // Use Shopify REST Admin API directly via fetch (most compatible)
    // ---------------------------------------------------------------
    const productPayload: any = {
      product: {
        title: title,
        body_html: description || '',
        vendor: vendor || '',
        product_type: category || '',
        status: (status || 'active').toLowerCase(),
        variants: [
          {
            price: parseFloat(price).toFixed(2),
            sku: sku || '',
            inventory_management: 'shopify',
          }
        ]
      }
    };

    // Attach image if provided
    if (imageUrl && imageUrl.trim() !== '') {
      productPayload.product.images = [{ src: imageUrl.trim() }];
    }

    const shopifyResponse = await fetch(
      `https://${shopDomain}/admin/api/2024-01/products.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify(productPayload),
      }
    );

    if (!shopifyResponse.ok) {
      const errorBody = await shopifyResponse.text();
      console.error('Shopify API Error:', shopifyResponse.status, errorBody);
      return res.status(shopifyResponse.status).json({
        error: `Shopify API returned ${shopifyResponse.status}`,
        details: errorBody
      });
    }

    const shopifyData = await shopifyResponse.json() as any;
    const shopifyProduct = shopifyData.product;
    const shopifyVariant = shopifyProduct.variants[0];
    const resolvedImageUrl = shopifyProduct.image?.src || (imageUrl?.trim() || null);

    // Retrieve shop record from DB
    const shop = await prisma.shop.findUnique({ where: { domain: shopDomain } });
    if (!shop) throw new Error('Shop not found in DB');

    // Save to local database
    const newProduct = await prisma.product.create({
      data: {
        shopId: shop.id,
        shopifyId: `gid://shopify/Product/${shopifyProduct.id}`,
        title: shopifyProduct.title,
        handle: shopifyProduct.handle,
        status: shopifyProduct.status ? shopifyProduct.status.toUpperCase() : 'ACTIVE',
        imageUrl: resolvedImageUrl,
        variants: {
          create: {
            shopifyId: `gid://shopify/ProductVariant/${shopifyVariant.id}`,
            title: shopifyVariant.title || 'Default Title',
            sku: shopifyVariant.sku || '',
            price: parseFloat(shopifyVariant.price || '0'),
            inventory: {
              create: {
                quantity: 0
              }
            }
          }
        }
      },
      include: {
        variants: { include: { inventory: true } }
      }
    });

    res.status(201).json({ success: true, product: newProduct });
  } catch (error: any) {
    console.error('Failed to push product to Shopify:', error);
    res.status(500).json({ error: 'Failed to push product to Shopify', details: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const session = res.locals.shopifySession;
    const id = req.params.id as string;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || !product.shopifyId) {
      return res.status(404).json({ error: 'Product not found or not synced to Shopify' });
    }

    // Extract numeric ID from gid://shopify/Product/123456789
    const shopifyNumericId = (product.shopifyId.split('/').pop() || product.shopifyId) as string;
    const shopDomain = session.shop as string;
    const accessToken = (Array.isArray(session.accessToken) ? session.accessToken[0] : session.accessToken) as string;

    const deleteResponse = await fetch(
      `https://${shopDomain}/admin/api/2024-01/products/${shopifyNumericId}.json`,
      {
        method: 'DELETE',
        headers: {
          'X-Shopify-Access-Token': accessToken,
        },
      }
    );

    if (!deleteResponse.ok && deleteResponse.status !== 404) {
      const errorBody = await deleteResponse.text();
      console.error('Shopify Delete Error:', deleteResponse.status, errorBody);
      return res.status(deleteResponse.status).json({ error: 'Failed to delete from Shopify' });
    }

    // Delete locally
    await prisma.product.delete({ where: { id: id as string } });

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete product from Shopify:', error);
    res.status(500).json({ error: 'Failed to delete product', details: error.message });
  }
});

export default router;
