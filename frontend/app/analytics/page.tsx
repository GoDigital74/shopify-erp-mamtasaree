'use client';

import { useEffect, useState } from 'react';
import { Page, Layout, Card, Text, BlockStack, InlineStack, DataTable, Banner } from '@shopify/polaris';
import { authenticatedFetch } from '@/lib/api';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch('/api/analytics');
      if (res.ok) {
        setAnalytics(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const lowStockRows = analytics?.inventory?.lowStockItems?.map((item: any) => [
    item.variant?.product?.title || 'Unknown Product',
    item.variant?.title || 'Unknown Variant',
    item.quantity.toString()
  ]) || [];

  return (
    <Page title="Reports & Analytics">
      <BlockStack gap="500">
        <Layout>
          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Total Sales</Text>
                <Text as="p" variant="heading3xl" tone="success">
                  {loading ? '...' : `$${analytics?.sales?.total?.toFixed(2) || '0.00'}`}
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  From {loading ? '...' : analytics?.sales?.count || 0} total orders
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
          
          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Inventory Health</Text>
                <Text as="p" variant="heading3xl" tone={lowStockRows.length > 0 ? 'critical' : 'success'}>
                  {loading ? '...' : lowStockRows.length}
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Low stock items requiring attention
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            {lowStockRows.length > 0 && (
              <Banner title="Action Required: Low Stock Items" tone="warning">
                <p>Some items are running low on stock. Consider creating a Purchase Order.</p>
              </Banner>
            )}
            <Card padding="0">
              <BlockStack gap="400">
                <div style={{ padding: '1rem' }}>
                  <Text as="h2" variant="headingMd">Low Stock Alerts</Text>
                </div>
                <DataTable
                  columnContentTypes={['text', 'text', 'numeric']}
                  headings={['Product', 'Variant', 'Quantity']}
                  rows={lowStockRows}
                />
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
