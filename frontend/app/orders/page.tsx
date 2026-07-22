'use client';
import { Page, Layout, Card, Text, BlockStack } from '@shopify/polaris';

export default function OrdersPage() {
  return (
    <Page title="Orders">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Synced Orders</Text>
              <Text as="p">This page will display all orders synced from Shopify.</Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
