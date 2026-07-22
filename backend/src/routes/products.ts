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

    const client = new shopify.clients.Graphql({ session });
    
    const query = `
      mutation productSet($input: ProductSetInput!) {
        productSet(input: $input) {
          product {
            id
            title
            handle
            status
            variants(first: 1) {
              edges {
                node {
                  id
                  price
                  sku
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        title: title,
        descriptionHtml: description,
        variants: [
          {
            price: price.toString(),
            sku: sku
          }
        ]
      }
    };

    const response = await client.request(query, { variables });
    const productData = (response.data as any).productSet;

    if (productData.userErrors && productData.userErrors.length > 0) {
      return res.status(400).json({ errors: productData.userErrors });
    }

    const shopifyProduct = productData.product;
    const shopifyVariant = shopifyProduct.variants.edges[0].node;

    // Retrieve shop ID
    const shop = await prisma.shop.findUnique({ where: { domain: session.shop } });
    if (!shop) throw new Error("Shop not found in DB");

    // Save to our Local Database
    const newProduct = await prisma.product.create({
      data: {
        shopId: shop.id,
        shopifyId: shopifyProduct.id,
        title: shopifyProduct.title,
        handle: shopifyProduct.handle,
        status: shopifyProduct.status,
        variants: {
          create: {
            shopifyId: shopifyVariant.id,
            title: "Default Title",
            sku: shopifyVariant.sku,
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
