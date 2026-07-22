require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkAndRestore() {
  // 1. Check how many products are in local DB
  const products = await prisma.product.findMany({
    include: { variants: true }
  });

  console.log(`\n✅ Found ${products.length} products in local DB\n`);

  if (products.length === 0) {
    console.log('❌ No products in local DB either. Cannot restore.');
    await prisma.$disconnect();
    return;
  }

  // 2. Test Shopify API token
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_TOKEN;
  
  console.log(`Shop domain: ${shopDomain}`);
  console.log(`Token starts with: ${token ? token.substring(0, 8) + '...' : 'MISSING'}\n`);

  const testRes = await fetch(`https://${shopDomain}/admin/api/2024-01/shop.json`, {
    headers: { 'X-Shopify-Access-Token': token }
  });

  if (!testRes.ok) {
    const body = await testRes.text();
    console.log(`❌ Token invalid (${testRes.status}): ${body}`);
    console.log('\n⚠️  You need to regenerate your Shopify Admin API token before restoring.');
    console.log('Go to: Shopify Admin → Settings → Apps and sales channels → Your custom app → API credentials → Rotate\n');
    await prisma.$disconnect();
    return;
  }

  const shopData = await testRes.json();
  console.log(`✅ Token valid! Shop: ${shopData.shop.name}\n`);
  console.log('🚀 Starting product restoration...\n');

  let restored = 0;
  let failed = 0;

  for (const product of products) {
    const variant = product.variants[0];
    
    const payload = {
      product: {
        title: product.title,
        handle: product.handle,
        body_html: '',
        status: product.status === 'ACTIVE' ? 'active' : 'draft',
        images: product.imageUrl ? [{ src: product.imageUrl }] : [],
        variants: [{
          price: variant ? variant.price.toString() : '0.00',
          sku: variant ? (variant.sku || '') : '',
        }]
      }
    };

    const res = await fetch(`https://${shopDomain}/admin/api/2024-01/products.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      const newShopifyId = `gid://shopify/Product/${data.product.id}`;
      const newVariantId = data.product.variants[0] ? `gid://shopify/ProductVariant/${data.product.variants[0].id}` : null;

      // Update the local DB with the new Shopify ID
      await prisma.product.update({
        where: { id: product.id },
        data: { shopifyId: newShopifyId }
      });

      if (variant && newVariantId) {
        await prisma.variant.update({
          where: { id: variant.id },
          data: { shopifyId: newVariantId }
        });
      }

      restored++;
      console.log(`✅ [${restored}] Restored: "${product.title}"`);
    } else {
      const err = await res.text();
      failed++;
      console.log(`❌ Failed: "${product.title}" → ${res.status}: ${err.substring(0, 100)}`);
    }

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\n🎉 Done! Restored: ${restored}, Failed: ${failed}`);
  await prisma.$disconnect();
}

checkAndRestore().catch(async e => {
  console.error('Fatal error:', e.message);
  await prisma.$disconnect();
});
