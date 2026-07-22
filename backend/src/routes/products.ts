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
      take: 20
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
    const { title, description, price, sku } = req.body;

    const client = new shopify.clients.Rest({ session });
    
    // Structure the payload for the REST API
    const productPayload: any = {
      product: {
        title: title,
        body_html: description,
        status: req.body.status || 'active', // optional status from frontend
        variants: [
          {
            price: price.toString(),
            sku: sku || ""
          }
        ]
      }
    };

    // If an image URL is provided, attach it
    if (req.body.imageUrl) {
      productPayload.product.images = [
        { src: req.body.imageUrl }
      ];
    }

    const response = await client.post({
      path: 'products',
      data: productPayload,
      type: 'application/json'
    });

    const shopifyProduct = (response.body as any).product;
    const shopifyVariant = shopifyProduct.variants[0];

    // Retrieve shop ID
    const shop = await prisma.shop.findUnique({ where: { domain: session.shop } });
    if (!shop) throw new Error("Shop not found in DB");

    // Save to our Local Database
    const newProduct = await prisma.product.create({
      data: {
        shopId: shop.id,
        shopifyId: `gid://shopify/Product/${shopifyProduct.id}`,
        title: shopifyProduct.title,
        handle: shopifyProduct.handle,
        status: shopifyProduct.status ? shopifyProduct.status.toUpperCase() : "ACTIVE",
        imageUrl: shopifyProduct.image?.src || null,
        variants: {
          create: {
            shopifyId: `gid://shopify/ProductVariant/${shopifyVariant.id}`,
            title: shopifyVariant.title || "Default Title",
            sku: shopifyVariant.sku || "",
            price: parseFloat(shopifyVariant.price || "0"),
            inventory: {
              create: {
                quantity: 0
              }
            }
          }
        }
      }
    });

    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Failed to push product to Shopify:', error);
    res.status(500).json({ error: 'Failed to push product to Shopify' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const session = res.locals.shopifySession;
    const { id } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || !product.shopifyId) {
      return res.status(404).json({ error: "Product not found or not synced to Shopify" });
    }

    const client = new shopify.clients.Graphql({ session });
    const query = `
      mutation productDelete($input: ProductDeleteInput!) {
        productDelete(input: $input) {
          deletedProductId
          userErrors {
            field
            message
          }
        }
      }
    `;
    const variables = {
      input: {
        id: product.shopifyId
      }
    };

    const response = await client.request(query, { variables });
    const productData = (response.data as any).productDelete;

    if (productData.userErrors && productData.userErrors.length > 0) {
      return res.status(400).json({ errors: productData.userErrors });
    }

    // Delete locally
    await prisma.product.delete({ where: { id } });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to delete product from Shopify:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
