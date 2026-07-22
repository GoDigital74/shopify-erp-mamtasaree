require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function getTokenAndRestore() {
  const shopDomain = 'mamta-saree-n6y5eqfn.myshopify.com';
  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecret = process.env.SHOPIFY_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.error('❌ SHOPIFY_API_KEY or SHOPIFY_API_SECRET missing in .env');
    await prisma.$disconnect();
    return;
  }

  console.log('🔑 Getting access token via Client Credentials flow...');

  // Try to get token using client_credentials grant
  const tokenRes = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: apiKey,
      client_secret: apiSecret,
    })
  });

  let accessToken = null;

  if (tokenRes.ok) {
    const tokenData = await tokenRes.json();
    accessToken = tokenData.access_token;
    console.log(`✅ Got access token: ${accessToken.substring(0, 12)}...`);
  } else {
    const err = await tokenRes.text();
    console.log(`⚠️  Client credentials failed (${tokenRes.status}): ${err}`);
    console.log('\nTrying stored session token from database...');

    // Fallback: try getting token from DB session
    const session = await prisma.session.findFirst();
    if (session && session.accessToken) {
      accessToken = session.accessToken;
      console.log(`✅ Found token in DB session: ${accessToken.substring(0, 12)}...`);
    } else {
      console.log('❌ No session token in DB either.');
      console.log('\nPlease manually add to .env:');
      console.log('SHOPIFY_ADMIN_TOKEN="shpat_XXXX"');
      await prisma.$disconnect();
      return;
    }
  }

  // Test the token
  const testRes = await fetch(`https://${shopDomain}/admin/api/2024-01/shop.json`, {
    headers: { 'X-Shopify-Access-Token': accessToken }
  });

  if (!testRes.ok) {
    const body = await testRes.text();
    console.log(`❌ Token test failed (${testRes.status}): ${body}`);
    await prisma.$disconnect();
    return;
  }

  const shopData = await testRes.json();
  console.log(`✅ Connected to shop: ${shopData.shop.name}\n`);

  // Get all products from local DB
  const products = await prisma.product.findMany({
    include: { variants: true }
  });
  console.log(`📦 Found ${products.length} products to restore to Shopify\n`);

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
          price: variant ? variant.price.toFixed(2) : '0.00',
          sku: variant ? (variant.sku || '') : '',
        }]
      }
    };

    const res = await fetch(`https://${shopDomain}/admin/api/2024-01/products.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      const newShopifyId = `gid://shopify/Product/${data.product.id}`;
      const newVariantId = data.product.variants[0]
        ? `gid://shopify/ProductVariant/${data.product.variants[0].id}`
        : null;

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
      console.log(`✅ [${restored}/${products.length}] Restored: "${product.title}"`);
    } else {
      const err = await res.text();
      failed++;
      console.log(`❌ Failed: "${product.title}" → ${res.status}: ${err.substring(0, 120)}`);
    }

    // 250ms delay to avoid Shopify rate limits
    await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\n🎉 DONE! Restored: ${restored}, Failed: ${failed}`);
  console.log('\nGo to your Shopify Admin → Products to confirm everything is back!');
  await prisma.$disconnect();
}

getTokenAndRestore().catch(async e => {
  console.error('Fatal error:', e.message);
  await prisma.$disconnect();
});
