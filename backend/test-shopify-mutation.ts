import 'dotenv/config';
import { shopifyApi, ApiVersion, Session } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY || 'dummy',
  apiSecretKey: process.env.SHOPIFY_API_SECRET || 'dummy',
  scopes: ['write_products'],
  hostName: 'localhost',
  apiVersion: ApiVersion.October24,
  isEmbeddedApp: false,
});

async function test() {
  const session = new Session({
    id: 'test',
    shop: process.env.SHOPIFY_SHOP_DOMAIN || 'mamta-saree-n6y5eqfn.myshopify.com',
    state: 'test',
    isOnline: false,
    accessToken: process.env.SHOPIFY_ADMIN_TOKEN || '',
  });

  const client = new shopify.clients.Graphql({ session });
  
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
    const res = await client.request(query, { variables });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (error: any) {
    if (error.response) {
      console.error(JSON.stringify(error.response.errors, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

test();
