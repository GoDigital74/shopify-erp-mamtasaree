require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function cleanup() {
  const shopDomain = 'mamta-saree-n6y5eqfn.myshopify.com';
  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecret = process.env.SHOPIFY_API_SECRET;

  console.log('🔑 Getting fresh access token...');

  // Get fresh token via client_credentials
  const tokenRes = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: apiKey,
      client_secret: apiSecret,
    })
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error('❌ Failed to get token:', tokenRes.status, err);
    await prisma.$disconnect();
    return;
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  console.log(`✅ Got fresh token: ${accessToken.substring(0, 12)}...\n`);

  // Test token
  const testRes = await fetch(`https://${shopDomain}/admin/api/2024-01/shop.json`, {
    headers: { 'X-Shopify-Access-Token': accessToken }
  });
  if (!testRes.ok) {
    console.error('❌ Token test failed:', await testRes.text());
    await prisma.$disconnect();
    return;
  }

  // Fetch ALL products directly from Shopify to delete them
  console.log('📦 Fetching all products from Shopify store to delete...');
  const listRes = await fetch(`https://${shopDomain}/admin/api/2024-01/products.json?limit=250`, {
    headers: { 'X-Shopify-Access-Token': accessToken }
  });
  const listData = await listRes.json();
  const shopifyProducts = listData.products || [];
  console.log(`Found ${shopifyProducts.length} products on Shopify to delete\n`);

  let deleted = 0;
  let failed = 0;

  for (const p of shopifyProducts) {
    const res = await fetch(
      `https://${shopDomain}/admin/api/2024-01/products/${p.id}.json`,
      { method: 'DELETE', headers: { 'X-Shopify-Access-Token': accessToken } }
    );

    if (res.ok || res.status === 404) {
      deleted++;
      console.log(`🗑️  [${deleted}/${shopifyProducts.length}] Deleted: "${p.title}"`);
    } else {
      failed++;
      console.log(`❌ Failed: "${p.title}" → ${res.status}`);
    }
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n✅ DONE! Deleted: ${deleted}, Failed: ${failed}`);
  console.log(`Store ${shopDomain} is now clean.\n`);
  await prisma.$disconnect();
}

cleanup().catch(async e => {
  console.error('Fatal:', e.message);
  await prisma.$disconnect();
});
