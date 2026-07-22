'use client';

import { useEffect, useState } from 'react';
import { Page, Layout, Card, ResourceList, ResourceItem, Text, Badge, SkeletonPage, SkeletonBodyText } from '@shopify/polaris';
import { authenticatedFetch } from '@/lib/api';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        <Layout>
          <Layout.Section>
            <Card>
              <SkeletonBodyText lines={5} />
            </Card>
          </Layout.Section>
        </Layout>
      </SkeletonPage>
    );
  }

  return (
    <Page title="Products">
      <Layout>
        <Layout.Section>
          <Card padding="0">
            <ResourceList
              resourceName={{ singular: 'product', plural: 'products' }}
              items={products}
              renderItem={(item) => {
                const { id, title, handle, status } = item;
                
                return (
                  <ResourceItem id={id} url="#" accessibilityLabel={`View details for ${title}`}>
                    <Text variant="bodyMd" fontWeight="bold" as="h3">
                      {title}
                    </Text>
                    <div>{handle}</div>
                    <Badge tone={status === 'active' ? 'success' : 'critical'}>
                      {status}
                    </Badge>
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
