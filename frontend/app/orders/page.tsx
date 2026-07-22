'use client';

import { useEffect, useState } from 'react';
import { Page, Layout, Card, IndexTable, Text, Badge, Spinner, BlockStack } from '@shopify/polaris';
import { authenticatedFetch } from '@/lib/api';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await authenticatedFetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (err) {
        console.error('Failed to fetch orders', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const rowMarkup = orders.map((order, index) => (
    <IndexTable.Row id={order.id} key={order.id} position={index}>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold" as="span">
          {order.shopifyId?.split('/').pop() || order.id.slice(0, 8)}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        ${parseFloat(order.totalPrice).toFixed(2)}
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={order.status === 'paid' || order.status === 'success' ? 'success' : 'attention'}>
          {order.status}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        {order.orderItems?.length || 0} items
      </IndexTable.Cell>
      <IndexTable.Cell>
        {new Date(order.createdAt).toLocaleDateString()}
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page title="Orders">
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <Spinner size="large" />
              </div>
            ) : (
              <IndexTable
                resourceName={{ singular: 'order', plural: 'orders' }}
                itemCount={orders.length}
                headings={[
                  { title: 'Order ID' },
                  { title: 'Total' },
                  { title: 'Status' },
                  { title: 'Items' },
                  { title: 'Date' },
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
