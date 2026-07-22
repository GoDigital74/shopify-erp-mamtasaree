'use client';

import { useEffect, useState } from 'react';
import { Page, Layout, Card, IndexTable, Text, Badge, Spinner, BlockStack } from '@shopify/polaris';
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
        console.error('Failed to fetch inventory', err);
      } finally {
        setLoading(false);
      }
    }
    fetchInventory();
  }, []);

  const rowMarkup = inventory.map((inv, index) => {
    const productTitle = inv.variant?.product?.title || 'Unknown Product';
    const variantTitle = inv.variant?.title || 'Unknown Variant';
    const sku = inv.variant?.sku || 'No SKU';
    
    return (
      <IndexTable.Row id={inv.id} key={inv.id} position={index}>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {productTitle}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {variantTitle}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone="info">{sku}</Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={inv.quantity > 0 ? 'success' : 'critical'}>
            {inv.quantity} in stock
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {new Date(inv.updatedAt).toLocaleDateString()}
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <Page title="Inventory Tracking">
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <Spinner size="large" />
              </div>
            ) : (
              <IndexTable
                resourceName={{ singular: 'inventory item', plural: 'inventory items' }}
                itemCount={inventory.length}
                headings={[
                  { title: 'Product' },
                  { title: 'Variant' },
                  { title: 'SKU' },
                  { title: 'Quantity' },
                  { title: 'Last Updated' },
                ]}
                selectable={false}
              >
                {rowMarkup}
              </IndexTable>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
