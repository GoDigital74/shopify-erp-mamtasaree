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
      mutation productCreate($input: ProductInput!) {
        productCreate(input: $input) {
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
            price: price,
            sku: sku
          }
        ]
      }
    };

    const response = await client.request(query, { variables });
    const productData = (response.data as any).productCreate;

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

export default router;
