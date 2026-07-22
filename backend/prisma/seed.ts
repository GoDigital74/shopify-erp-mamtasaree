import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding...');

  // 1. Create a dummy Shop
  const shop = await prisma.shop.upsert({
    where: { domain: 'demo-store.myshopify.com' },
    update: {},
    create: {
      domain: 'demo-store.myshopify.com',
    },
  });
  console.log(`Created shop with id: ${shop.id}`);

  // 2. Create products
  const product1 = await prisma.product.upsert({
    where: { shopifyId: 'gid://shopify/Product/1234567890' },
    update: {},
    create: {
      shopId: shop.id,
      shopifyId: 'gid://shopify/Product/1234567890',
      title: 'Ergonomic Chair',
      handle: 'ergonomic-chair',
      status: 'active',
      variants: {
        create: {
          title: 'Default Title',
          sku: 'CHAIR-01',
          price: 199.99,
          inventory: {
            create: {
              quantity: 50,
            }
          }
        }
      }
    }
  });

  const product2 = await prisma.product.upsert({
    where: { shopifyId: 'gid://shopify/Product/0987654321' },
    update: {},
    create: {
      shopId: shop.id,
      shopifyId: 'gid://shopify/Product/0987654321',
      title: 'Standing Desk',
      handle: 'standing-desk',
      status: 'active',
      variants: {
        create: {
          title: 'Default Title',
          sku: 'DESK-01',
          price: 499.99,
          inventory: {
            create: {
              quantity: 20,
            }
          }
        }
      }
    }
  });
  console.log(`Created dummy products.`);

  // 3. Create a Vendor
  const vendor = await prisma.vendor.create({
    data: {
      name: 'Office Supplies Co.',
      email: 'sales@officesupplies.example.com',
    }
  });
  console.log(`Created vendor with id: ${vendor.id}`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
