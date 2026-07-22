'use client';
import { Page, Layout, Card, Text, BlockStack } from '@shopify/polaris';

export default function InventoryPage() {
  return (
    <Page title="Inventory">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Inventory Tracking</Text>
              <Text as="p">This page will display your stock levels and variants.</Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
