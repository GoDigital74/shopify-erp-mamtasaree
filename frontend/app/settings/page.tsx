'use client';

import { useState, useCallback } from 'react';
import { Page, Layout, Card, Text, BlockStack, FormLayout, TextField, Checkbox, Button, Toast, Frame } from '@shopify/polaris';

export default function SettingsPage() {
  const [shopEmail, setShopEmail] = useState('admin@store.com');
  const [syncOrders, setSyncOrders] = useState(true);
  const [syncInventory, setSyncInventory] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);
  const [toastActive, setToastActive] = useState(false);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    // Integrate with your backend API here to save settings
    // await authenticatedFetch('/api/settings', { method: 'POST', body: ... })
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulated delay
    setIsSaving(false);
    setToastActive(true);
  }, []);

  const toggleToastActive = useCallback(() => setToastActive((active) => !active), []);

  const toastMarkup = toastActive ? (
    <Toast content="Settings saved successfully" onDismiss={toggleToastActive} />
  ) : null;

  return (
    <Frame>
      <Page title="App Settings">
        <Layout>
          <Layout.Section>
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">Synchronization Preferences</Text>
                  <Text as="p" tone="subdued">Control how your app synchronizes data with the backend ERP.</Text>
                  <FormLayout>
                    <Checkbox
                      label="Auto-sync orders"
                      helpText="Automatically sync new orders to the backend every 15 minutes."
                      checked={syncOrders}
                      onChange={setSyncOrders}
                    />
                    <Checkbox
                      label="Auto-sync inventory"
                      helpText="Keep inventory levels up to date across all sales channels."
                      checked={syncInventory}
                      onChange={setSyncInventory}
                    />
                  </FormLayout>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">Notifications</Text>
                  <FormLayout>
                    <TextField
                      label="Support Email Address"
                      type="email"
                      value={shopEmail}
                      onChange={setShopEmail}
                      autoComplete="email"
                      helpText="Where should we send alert notifications?"
                    />
                    <Checkbox
                      label="Enable Low Stock Alerts"
                      checked={lowStockAlerts}
                      onChange={setLowStockAlerts}
                    />
                    <div style={{ marginTop: '1rem' }}>
                      <Button variant="primary" onClick={handleSave} loading={isSaving}>
                        Save Settings
                      </Button>
                    </div>
                  </FormLayout>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
        {toastMarkup}
      </Page>
    </Frame>
  );
}

