'use client';
import { Page, Layout, Card, Text, BlockStack } from '@shopify/polaris';

export default function SettingsPage() {
  return (
    <Page title="Settings">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">App Settings</Text>
              <Text as="p">Configure your synchronization preferences here.</Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
