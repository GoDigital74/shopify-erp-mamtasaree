import '@shopify/shopify-api/adapters/node';
import { shopifyApp } from '@shopify/shopify-app-express';
import { PrismaSessionStorage } from '@shopify/shopify-app-session-storage-prisma';
import { ApiVersion } from '@shopify/shopify-api';
import prisma from './prisma'; // Adjust this path if your prisma.ts file is located elsewhere in src/
import dotenv from 'dotenv';

dotenv.config();

export const shopify = shopifyApp({
  api: {
    apiVersion: '2024-10' as any,
    apiKey: process.env.SHOPIFY_API_KEY || '',
    apiSecretKey: process.env.SHOPIFY_API_SECRET || '',
    scopes: process.env.SHOPIFY_SCOPES?.split(',') || ['read_products', 'write_products', 'read_orders'],
    hostName: process.env.HOST?.replace(/https?:\/\//, '') || 'localhost:5000',
    isEmbeddedApp: true,
  },
  auth: {
    path: '/api/auth',
    callbackPath: '/api/auth/callback',
  },
  webhooks: {
    path: '/api/webhooks',
  },
  sessionStorage: new PrismaSessionStorage(prisma),
});
