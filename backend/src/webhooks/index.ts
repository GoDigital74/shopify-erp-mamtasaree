import { shopify } from '../index';
import { DeliveryMethod } from '@shopify/shopify-api';
import prisma from '../prisma';

export function setupWebhooks() {
  shopify.webhooks.addHandlers({
    PRODUCTS_CREATE: [
      {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: '/api/webhooks',
        callback: async (topic, shop, body, webhookId) => {
          console.log(`[Webhook] ${topic} received for shop ${shop}`);
          const payload = JSON.parse(body);
          
          const shopRecord = await prisma.shop.upsert({
            where: { domain: shop },
            update: {},
            create: { domain: shop },
          });

          await prisma.product.upsert({
            where: { shopifyId: `gid://shopify/Product/${payload.id}` },
            update: {
              title: payload.title,
              handle: payload.handle,
              status: payload.status,
            },
            create: {
              shopId: shopRecord.id,
              shopifyId: `gid://shopify/Product/${payload.id}`,
              title: payload.title,
              handle: payload.handle,
              status: payload.status,
            },
          });
          console.log(`[Webhook] Processed product ${payload.id}`);
        },
      },
    ],
    PRODUCTS_UPDATE: [
      {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: '/api/webhooks',
        callback: async (topic, shop, body, webhookId) => {
          console.log(`[Webhook] ${topic} received for shop ${shop}`);
          const payload = JSON.parse(body);
          
          await prisma.product.update({
            where: { shopifyId: `gid://shopify/Product/${payload.id}` },
            data: {
              title: payload.title,
              handle: payload.handle,
              status: payload.status,
            },
          }).catch(err => console.log('Product not found for update webhook, skipping.'));
        },
      },
    ],
    ORDERS_CREATE: [
      {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: '/api/webhooks',
        callback: async (topic, shop, body, webhookId) => {
          console.log(`[Webhook] ${topic} received for shop ${shop}`);
          const payload = JSON.parse(body);
          
          const shopRecord = await prisma.shop.upsert({
            where: { domain: shop },
            update: {},
            create: { domain: shop },
          });

          await prisma.order.upsert({
            where: { shopifyId: `gid://shopify/Order/${payload.id}` },
            update: {
              totalPrice: parseFloat(payload.total_price),
              status: payload.financial_status || 'pending',
            },
            create: {
              shopId: shopRecord.id,
              shopifyId: `gid://shopify/Order/${payload.id}`,
              totalPrice: parseFloat(payload.total_price),
              status: payload.financial_status || 'pending',
            },
          });
          console.log(`[Webhook] Processed order ${payload.id}`);
        },
      },
    ]
  });
}
