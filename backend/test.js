import 'dotenv/config';

async function test() {
  const shop = process.env.SHOPIFY_SHOP_DOMAIN || 'mamta-saree-n6y5eqfn.myshopify.com';
  const token = process.env.SHOPIFY_ADMIN_TOKEN;

  if (!token) {
    console.error("Missing SHOPIFY_ADMIN_TOKEN");
    return;
  }

  const query = `
    mutation productCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          title
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
      title: "Test Product from CLI",
      variants: [
        {
          price: "11.11"
        }
      ]
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
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

test();
