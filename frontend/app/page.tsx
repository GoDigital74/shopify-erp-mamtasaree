'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Button,
  Banner,
  Spinner,
  List,
} from '@shopify/polaris';
import { authenticatedFetch } from '@/lib/api';

// 1. Move the main logic into a child component
function DashboardContent() {
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop');
  
  // Backend connection state
  const [backendStatus, setBackendStatus] = useState<string>('Connecting...');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Products state (removed from here, moved to products page)
  
  useEffect(() => {
    async function verifyBackendConnection() {
      try {
        setLoading(true);
        const res = await authenticatedFetch('/api/health');
        if (res.ok) {
          setBackendStatus('Connected');
        } else {
          setBackendStatus('Disconnected');
        }
      } catch (err: unknown) {
        console.error(err);
        setError('Could not reach Express backend at http://localhost:5000');
        setBackendStatus('Error');
      } finally {
        setLoading(false);
      }
    }

    verifyBackendConnection();
  }, []);

  const [syncingProducts, setSyncingProducts] = useState(false);
  const [syncingOrders, setSyncingOrders] = useState(false);

  const handleSyncProducts = async () => {
    setSyncingProducts(true);
    try {
      const res = await authenticatedFetch('/api/shopify/sync/products', { method: 'POST' });
      if (res.ok) alert('Products synced successfully!');
      else alert('Failed to sync products.');
    } catch (e) {
      console.error(e);
      alert('Error syncing products');
    } finally {
      setSyncingProducts(false);
    }
  };

  const handleSyncOrders = async () => {
    setSyncingOrders(true);
    try {
      const res = await authenticatedFetch('/api/shopify/sync/orders', { method: 'POST' });
      if (res.ok) alert('Orders synced successfully!');
      else alert('Failed to sync orders.');
    } catch (e) {
      console.error(e);
      alert('Error syncing orders');
    } finally {
      setSyncingOrders(false);
    }
  };

  return (
    <Page title="iNext ERP Dashboard">
      <BlockStack gap="500">
        {error && (
          <Banner title="Backend Connection Issue" tone="critical">
            <p>{error}</p>
          </Banner>
        )}

        <Layout>
          {/* Main Status Section */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Store & Backend Connection
                </Text>

                <InlineStack align="space-between" blockAlign="center">
                  <Text as="p" variant="bodyMd">Authenticated Shop:</Text>
                  <Text as="span" variant="bodyMd" fontWeight="bold">
                    {shop || 'Loading shop domain...'}
                  </Text>
                </InlineStack>

                <InlineStack align="space-between" blockAlign="center">
                  <Text as="p" variant="bodyMd">Express Server:</Text>
                  {loading ? (
                    <Spinner size="small" />
                  ) : (
                    <Badge tone={backendStatus === 'Connected' ? 'success' : 'critical'}>
                      {backendStatus}
                    </Badge>
                  )}
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Quick Actions Side Card */}
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">Quick Actions</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Manage your ERP system
                </Text>
                
                <InlineStack gap="300">
                  <Button
                    url="/products"
                    disabled={backendStatus !== 'Connected'}
                  >
                    View Products
                  </Button>
                  <Button
                    url="/orders"
                    disabled={backendStatus !== 'Connected'}
                  >
                    View Orders
                  </Button>
                </InlineStack>
                
                <Text as="p" variant="bodySm" tone="subdued">
                  Manual Synchronization
                </Text>
                
                <Button
                  variant="primary"
                  loading={syncingProducts}
                  onClick={handleSyncProducts}
                  disabled={backendStatus !== 'Connected'}
                >
                  Sync Products
                </Button>
                <Button
                  variant="primary"
                  loading={syncingOrders}
                  onClick={handleSyncOrders}
                  disabled={backendStatus !== 'Connected'}
                >
                  Sync Orders
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}

// 2. Wrap the child component in a Suspense boundary for the default export
export default function DashboardPage() {
  return (
    <Suspense 
      fallback={
        <Page>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Spinner accessibilityLabel="Loading Dashboard" size="large" />
          </div>
        </Page>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
