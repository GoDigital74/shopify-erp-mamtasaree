'use client';

import { useEffect, useState } from 'react';
import { Page, Layout, Card, ResourceList, ResourceItem, Text, Avatar, SkeletonPage, SkeletonBodyText, BlockStack, InlineStack } from '@shopify/polaris';
import { authenticatedFetch } from '@/lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await authenticatedFetch('/api/customers');
        if (res.ok) {
          const data = await res.json();
          setCustomers(data);
        }
      } catch (err) {
        console.error('Failed to load customers', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  if (loading) {
    return (
      <SkeletonPage title="Customers">
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
    <Page title="Customers">
      <Layout>
        <Layout.Section>
          <Card padding="0">
            <ResourceList
              resourceName={{ singular: 'customer', plural: 'customers' }}
              items={customers}
              renderItem={(item) => {
                const { id, firstName, lastName, email, ordersCount, totalSpent } = item;
                const name = `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown Customer';
                const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2);

                return (
                  <ResourceItem id={id} url="#" accessibilityLabel={`View details for ${name}`}>
                    <InlineStack align="space-between" blockAlign="center">
                      <InlineStack gap="400" blockAlign="center">
                        <Avatar customer size="md" name={name} initials={initials} />
                        <BlockStack gap="100">
                          <Text variant="bodyMd" fontWeight="bold" as="h3">{name}</Text>
                          <Text variant="bodySm" tone="subdued" as="span">{email || 'No email provided'}</Text>
                        </BlockStack>
                      </InlineStack>
                      <InlineStack gap="400" blockAlign="center">
                        <Text variant="bodyMd" as="span">{ordersCount || 0} orders</Text>
                        <Text variant="bodyMd" fontWeight="semibold" as="span">${totalSpent || '0.00'}</Text>
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
