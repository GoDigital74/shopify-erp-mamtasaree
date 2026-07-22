import { shopify } from '../index';
import prisma from '../prisma';
import type { Session } from '@shopify/shopify-api';

export async function syncProducts(session: Session) {
  const client = new shopify.clients.Graphql({ session });

  // Make sure we have a Shop record in our DB
  const shopDomain = session.shop;
  const shopRecord = await prisma.shop.upsert({
    where: { domain: shopDomain },
    update: {},
    create: { domain: shopDomain },
  });

  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const query: string = `
      query getProducts($cursor: String) {
        products(first: 50, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              title
              handle
              status
              featuredImage {
                url
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    sku
                    price
                    inventoryQuantity
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await client.request(query, {
      variables: { cursor },
    });

    const productsData = (response.data as any).products;
    hasNextPage = productsData.pageInfo.hasNextPage;
    cursor = productsData.pageInfo.endCursor;

    for (const edge of productsData.edges) {
      const productNode = edge.node;
      const imageUrl = productNode.featuredImage?.url || null;

      const product = await prisma.product.upsert({
        where: { shopifyId: productNode.id },
        update: {
          title: productNode.title,
          handle: productNode.handle,
          status: productNode.status,
          imageUrl: imageUrl,
        },
        create: {
          shopId: shopRecord.id,
          shopifyId: productNode.id,
          title: productNode.title,
          handle: productNode.handle,
          status: productNode.status,
          imageUrl: imageUrl,
        },
      });

      for (const variantEdge of productNode.variants.edges) {
        const variantNode = variantEdge.node;

        const variant = await prisma.variant.upsert({
          where: { shopifyId: variantNode.id },
          update: {
            title: variantNode.title,
            sku: variantNode.sku,
            price: parseFloat(variantNode.price) || 0,
          },
          create: {
            productId: product.id,
            shopifyId: variantNode.id,
            title: variantNode.title,
            sku: variantNode.sku,
            price: parseFloat(variantNode.price) || 0,
          },
        });

        await prisma.inventory.upsert({
          where: { variantId: variant.id },
          update: {
            quantity: variantNode.inventoryQuantity || 0,
          },
          create: {
            variantId: variant.id,
            quantity: variantNode.inventoryQuantity || 0,
          },
        });
      }
    }
  }

  return { success: true, message: 'Products synced successfully' };
}

export async function syncOrders(session: Session) {
  const client = new shopify.clients.Graphql({ session });
  
  const shopDomain = session.shop;
  const shopRecord = await prisma.shop.upsert({
    where: { domain: shopDomain },
    update: {},
    create: { domain: shopDomain },
  });

  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const query: string = `
      query getOrders($cursor: String) {
        orders(first: 50, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              totalPriceSet {
                shopMoney {
                  amount
                }
              }
              displayFinancialStatus
              lineItems(first: 50) {
                edges {
                  node {
                    id
                    title
                    quantity
                    originalUnitPriceSet {
                      shopMoney {
                        amount
                      }
                    }
                    variant {
                      id
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await client.request(query, {
      variables: { cursor },
    });

    const ordersData = (response.data as any).orders;
    hasNextPage = ordersData.pageInfo.hasNextPage;
    cursor = ordersData.pageInfo.endCursor;

    for (const edge of ordersData.edges) {
      const orderNode = edge.node;
      
      const totalPrice = parseFloat(orderNode.totalPriceSet.shopMoney.amount);

      const order = await prisma.order.upsert({
        where: { shopifyId: orderNode.id },
        update: {
          totalPrice,
          status: orderNode.displayFinancialStatus || 'pending',
        },
        create: {
          shopId: shopRecord.id,
          shopifyId: orderNode.id,
          totalPrice,
          status: orderNode.displayFinancialStatus || 'pending',
        },
      });

      // Clear old items (simplistic sync approach for line items)
      await prisma.orderItem.deleteMany({
        where: { orderId: order.id }
      });

      for (const lineEdge of orderNode.lineItems.edges) {
        const lineNode = lineEdge.node;
        
        let variantId = null;
        if (lineNode.variant?.id) {
          const variant = await prisma.variant.findUnique({
            where: { shopifyId: lineNode.variant.id }
          });
          if (variant) {
            variantId = variant.id;
          }
        }

        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            variantId,
            quantity: lineNode.quantity,
            price: parseFloat(lineNode.originalUnitPriceSet?.shopMoney?.amount || "0"),
          }
        });
      }
    }
  }

  return { success: true, message: 'Orders synced successfully' };
}
