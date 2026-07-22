'use client';

import { useEffect, useState } from 'react';
import { Page, Layout, Card, ResourceList, ResourceItem, Text, Badge, SkeletonPage, SkeletonBodyText, BlockStack, InlineStack } from '@shopify/polaris';
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
        console.error('Failed to load orders', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <SkeletonPage title="Orders">
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
    <Page title="Orders">
      <Layout>
        <Layout.Section>
          <Card padding="0">
            <ResourceList
              resourceName={{ singular: 'order', plural: 'orders' }}
              items={orders}
              renderItem={(item) => {
                // Note: Adjust these destructured fields if your backend returns different property names
                const { id, name, totalPrice, financialStatus, fulfillmentStatus, createdAt } = item;
                
                return (
                  <ResourceItem id={id} url="#" accessibilityLabel={`View details for order ${name}`}>
                    <InlineStack align="space-between" blockAlign="center">
                      
                      {/* Left Side: Order Name and Date */}
                      <BlockStack gap="100">
                        <Text variant="bodyMd" fontWeight="bold" as="h3">
                          {name || `Order #${id}`}
                        </Text>
                        <Text variant="bodySm" tone="subdued" as="span">
                          {createdAt ? new Date(createdAt).toLocaleDateString() : 'No date'}
                        </Text>
                      </BlockStack>
                      
                      {/* Right Side: Price and Status Badges */}
                      <InlineStack gap="300" blockAlign="center">
                        <Text variant="bodyMd" as="span" fontWeight="semibold">
                          ${totalPrice || '0.00'}
                        </Text>
                        
                        <Badge tone={financialStatus === 'paid' ? 'success' : 'warning'}>
                          {financialStatus || 'Pending'}
                        </Badge>
                        
                        <Badge tone={fulfillmentStatus === 'fulfilled' ? 'success' : 'attention'}>
                          {fulfillmentStatus || 'Unfulfilled'}
                        </Badge>
                      </InlineStack>

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
