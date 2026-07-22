'use client';

import { useEffect, useState } from 'react';
import { Page, Layout, Card, DataTable, SkeletonPage, SkeletonBodyText, Badge, BlockStack, Text } from '@shopify/polaris';
import { authenticatedFetch } from '@/lib/api';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInventory() {
      try {
        const res = await authenticatedFetch('/api/inventory');
        if (res.ok) {
          const data = await res.json();
          setInventory(data);
        }
      } catch (err) {
        console.error('Failed to load inventory', err);
      } finally {
        setLoading(false);
      }
    }
    fetchInventory();
  }, []);

  if (loading) {
    return (
      <SkeletonPage title="Inventory">
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

  const rows = inventory.map((item) => [
    item.productTitle || 'Unknown Product',
    item.variantTitle || 'Default',
    item.sku || 'N/A',
    <Badge tone={item.quantity > 10 ? 'success' : item.quantity > 0 ? 'warning' : 'critical'} key={item.id}>
      {item.quantity.toString()} in stock
    </Badge>
  ]);

  return (
    <Page title="Inventory Tracking">
      <Layout>
        <Layout.Section>
          <Card padding="0">
            <BlockStack gap="400">
              <div style={{ padding: '1rem' }}>
                <Text as="h2" variant="headingMd">Stock Levels</Text>
              </div>
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text']}
                headings={['Product', 'Variant', 'SKU', 'Status']}
                rows={rows}
              />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
