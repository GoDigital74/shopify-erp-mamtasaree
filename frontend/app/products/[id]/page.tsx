'use client';

import { useEffect, useState } from 'react';
import { Page, Layout, Card, Text, BlockStack, InlineStack, Badge, SkeletonPage, SkeletonBodyText, Button } from '@shopify/polaris';
import { authenticatedFetch } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await authenticatedFetch('/api/products');
        if (res.ok) {
          const allProducts = await res.json();
          const p = allProducts.find((p: any) => p.id === id);
          setProduct(p);
        }
      } catch (err) {
        console.error('Failed to load product', err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <SkeletonPage title="Loading...">
        <Layout><Layout.Section><Card><SkeletonBodyText lines={5} /></Card></Layout.Section></Layout>
      </SkeletonPage>
    );
  }

  if (!product) {
    return (
      <Page title="Product Not Found" backAction={{ content: 'Products', onAction: () => router.push('/products') }}>
        <Card>
          <Text as="p">The product you are looking for does not exist in the local database.</Text>
        </Card>
      </Page>
    );
  }

  return (
    <Page 
      title={product.title} 
      backAction={{ content: 'Products', onAction: () => router.push('/products') }}
      primaryAction={{
        content: 'Edit in Shopify',
        onAction: async () => {
          // Get the numeric ID from the GID format: gid://shopify/Product/12345678
          const shopifyNumericId = product.shopifyId?.split('/').pop();
          if (!shopifyNumericId) return;

          // Fetch the shop domain from the backend health endpoint
          // then build the correct admin URL: https://{myshopify-domain}/admin/products/{id}
          try {
            const res = await authenticatedFetch('/api/health');
            const data = await res.json();
            const shopDomain = data.shop; // e.g. mamta-saree-n6y5eqfn.myshopify.com
            // This URL automatically redirects to the correct admin.shopify.com URL
            window.open(`https://${shopDomain}/admin/products/${shopifyNumericId}`, '_blank');
          } catch {
            // Fallback: open generic admin search
            window.open(`https://admin.shopify.com`, '_blank');
          }
        },
      }}
    >
      <Layout>
        <Layout.Section>
          <Card padding="400">
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text variant="headingMd" as="h2">Product Details</Text>
                <Badge tone={product.status === 'ACTIVE' ? 'success' : 'attention'}>{product.status}</Badge>
              </InlineStack>
              
              {product.imageUrl && (
                <div style={{ maxWidth: '200px' }}>
                  <img src={product.imageUrl} alt={product.title} style={{ width: '100%', borderRadius: '8px' }} />
                </div>
              )}
              
              <Text as="p"><strong>Handle:</strong> {product.handle}</Text>
              <Text as="p"><strong>Shopify ID:</strong> {product.shopifyId}</Text>
            </BlockStack>
          </Card>

          <div style={{ marginTop: '20px' }}>
            <Card padding="400">
              <Text variant="headingMd" as="h2">Variants & Inventory</Text>
              <div style={{ marginTop: '16px' }}>
                {product.variants?.map((variant: any) => (
                  <Card key={variant.id} background="bg-surface-secondary" padding="300">
                    <BlockStack gap="200">
                      <Text variant="headingSm" as="h3">{variant.title}</Text>
                      <Text as="p"><strong>SKU:</strong> {variant.sku || 'N/A'}</Text>
                      <Text as="p"><strong>Price:</strong> ${variant.price}</Text>
                      <Text as="p">
                        <strong>Inventory:</strong>{' '}
                        {variant.inventory?.quantity > 0 ? (
                          <Badge tone="success">{`${variant.inventory.quantity} in stock`}</Badge>
                        ) : (
                          <Badge tone="critical">Out of stock</Badge>
                        )}
                      </Text>
                    </BlockStack>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
