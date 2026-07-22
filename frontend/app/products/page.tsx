'use client';

import { useEffect, useState } from 'react';
import { Page, Layout, Card, ResourceList, ResourceItem, Text, SkeletonPage, SkeletonBodyText, InlineStack, BlockStack, Button, Thumbnail, Badge } from '@shopify/polaris';
import { ImageIcon } from '@shopify/polaris-icons';
import { authenticatedFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await authenticatedFetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <SkeletonPage title="Products">
        <Layout><Layout.Section><Card><SkeletonBodyText lines={5} /></Card></Layout.Section></Layout>
      </SkeletonPage>
    );
  }

  return (
    <Page 
      title="Products"
      primaryAction={{
        content: 'Create Product',
        onAction: () => router.push('/products/new'),
      }}
    >
      <Layout>
        <Layout.Section>
          <Card padding="0">
            <ResourceList
              resourceName={{ singular: 'product', plural: 'products' }}
              items={products}
              renderItem={(item) => {
                const { id, title, variants, imageUrl, status } = item;
                const firstVariant = variants?.[0];
                const price = firstVariant?.price ? `$${parseFloat(firstVariant.price).toFixed(2)}` : null;

                const media = (
                  <Thumbnail
                    source={imageUrl || ImageIcon}
                    alt={title}
                    size="medium"
                  />
                );

                return (
                  <ResourceItem
                    id={id}
                    media={media}
                    url={`/products/${id}`}
                    accessibilityLabel={`View details for ${title}`}
                  >
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <Text variant="bodyMd" fontWeight="bold" as="h3">{title}</Text>
                        <InlineStack gap="200">
                          {price && <Text variant="bodySm" tone="subdued" as="span">{price}</Text>}
                          <Badge tone={status === 'ACTIVE' ? 'success' : 'attention'}>
                            {status === 'ACTIVE' ? 'Active' : 'Draft'}
                          </Badge>
                        </InlineStack>
                      </BlockStack>

                      <Button
                        tone="critical"
                        variant="plain"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this product from Shopify?')) {
                            authenticatedFetch(`/api/products/${id}`, { method: 'DELETE' })
                              .then(() => window.location.reload());
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </InlineStack>
                  </ResourceItem>
                );
              }}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
