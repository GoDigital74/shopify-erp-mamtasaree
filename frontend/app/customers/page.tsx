'use client';
import { Page, Layout, Card, Text, BlockStack } from '@shopify/polaris';

export default function CustomersPage() {
  return (
    <Page title="Customers">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Customer Directory</Text>
              <Text as="p">This page will display your synced customer database.</Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
