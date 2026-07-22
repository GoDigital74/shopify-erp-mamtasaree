import 'dotenv/config';

async function test() {
  const shop = process.env.SHOPIFY_SHOP_DOMAIN || 'mamta-saree-n6y5eqfn.myshopify.com';
  const token = process.env.SHOPIFY_ADMIN_TOKEN;

  if (!token) return console.error("Missing token");

  const query = `
    mutation productCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          title
          variants(first: 1) {
            edges {
              node {
                id
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
      title: "Test Product from CLI Step 1",
      descriptionHtml: "desc"
    }
  };

  try {
    const res = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify({ query, variables })
    });

    const data = await res.json();
    require('fs').writeFileSync('graphql_result2.json', JSON.stringify(data, null, 2));
    console.log("Wrote to graphql_result2.json");
  } catch (err) {
    console.error(err);
  }
}

test();
