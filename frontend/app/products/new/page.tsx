'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Button,
  Banner,
  BlockStack,
  Text,
} from '@shopify/polaris';
import { authenticatedFetch } from '@/lib/api';

export default function NewProductPage() {
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title || !price) {
      setError('Title and Price are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authenticatedFetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          price: parseFloat(price),
          sku,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      // Redirect back to products page on success
      router.push('/products');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while creating the product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page
      title="Create New Product"
      backAction={{ content: 'Products', onAction: () => router.push('/products') }}
    >
      <Layout>
        <Layout.Section>
          {error && (
            <BlockStack gap="400">
              <Banner title="Error" tone="critical">
                <p>{error}</p>
              </Banner>
            </BlockStack>
          )}
          
          <div style={{ marginTop: error ? '1rem' : '0' }}>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Product Details</Text>
                <FormLayout>
                  <TextField
                    label="Title"
                    value={title}
                    onChange={setTitle}
                    autoComplete="off"
                    requiredIndicator
                  />
                  
                  <TextField
                    label="Description (HTML supported)"
                    value={description}
                    onChange={setDescription}
                    multiline={4}
                    autoComplete="off"
                  />
                  
                  <FormLayout.Group>
                    <TextField
                      label="Price"
                      type="number"
                      value={price}
                      onChange={setPrice}
                      prefix="$"
                      autoComplete="off"
                      requiredIndicator
                    />
                    <TextField
                      label="SKU (Stock Keeping Unit)"
                      value={sku}
                      onChange={setSku}
                      autoComplete="off"
                    />
                  </FormLayout.Group>

                  <Button variant="primary" onClick={handleSubmit} loading={loading}>
                    Create Product in Shopify
                  </Button>
                </FormLayout>
              </BlockStack>
            </Card>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
