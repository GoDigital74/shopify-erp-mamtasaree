'use client';

import { useEffect, useState } from 'react';
import { Page, Layout, Card, IndexTable, Text, Spinner, Badge } from '@shopify/polaris';
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

  const rowMarkup = customers.map((customer, index) => (
    <IndexTable.Row id={customer.id} key={customer.id} position={index}>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold" as="span">
          {customer.firstName} {customer.lastName}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        {customer.email || 'No email'}
      </IndexTable.Cell>
      <IndexTable.Cell>
        {new Date(customer.createdAt).toLocaleDateString()}
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page title="Customers">
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
                  { title: 'Added Date' },
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
