'use client';

import { useEffect, useState } from 'react';
import { Page, Layout, Card, IndexTable, Text, Badge, Spinner, BlockStack } from '@shopify/polaris';
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
        console.error('Failed to fetch customers', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  const rowMarkup = customers.map((customer, index) => {
    const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown Customer';
    
    return (
      <IndexTable.Row id={customer.id} key={customer.id} position={index}>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {fullName}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {customer.email || 'No email provided'}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodySm" tone="subdued" as="span">
            {customer.shopifyId?.split('/').pop() || customer.id.slice(0, 8)}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {new Date(customer.createdAt).toLocaleDateString()}
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <Page title="Customer Directory">
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <Spinner size="large" />
              </div>
            ) : (
              <IndexTable
                resourceName={{ singular: 'customer', plural: 'customers' }}
                itemCount={customers.length}
                headings={[
                  { title: 'Name' },
                  { title: 'Email' },
                  { title: 'Customer ID' },
                  { title: 'Joined Date' },
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
