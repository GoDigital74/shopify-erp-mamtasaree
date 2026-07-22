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
  Select,
  InlineStack,
  Badge,
} from '@shopify/polaris';
import { authenticatedFetch } from '@/lib/api';

export default function NewProductPage() {
  const router = useRouter();
  
  // Left Column States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  
  // Right Column States
  const [status, setStatus] = useState('active');
  const [vendor, setVendor] = useState('Mamta Saree Centre');
  const [category, setCategory] = useState('');
  
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
          imageUrl,
          status,
          vendor,
          category
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
      primaryAction={{
        content: 'Save Product',
        onAction: handleSubmit,
        loading: loading
      }}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <BlockStack gap="400">
              <Banner title="Error" tone="critical">
                <p>{error}</p>
              </Banner>
            </BlockStack>
          </Layout.Section>
        )}

        {/* LEFT COLUMN */}
        <Layout.Section>
          <BlockStack gap="400">
            
            {/* Title & Description */}
            <Card>
              <BlockStack gap="400">
                <FormLayout>
                  <TextField
                    label="Title"
                    value={title}
                    onChange={setTitle}
                    autoComplete="off"
                    requiredIndicator
                    placeholder="Short sleeve t-shirt"
                  />
                  <TextField
                    label="Description (HTML supported)"
                    value={description}
                    onChange={setDescription}
                    multiline={4}
                    autoComplete="off"
                  />
                </FormLayout>
              </BlockStack>
            </Card>

            {/* Media */}
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Media</Text>
                <TextField
                  label="Image URL"
                  value={imageUrl}
                  onChange={setImageUrl}
                  autoComplete="url"
                  placeholder="https://example.com/image.jpg"
                  helpText="Paste a direct URL to an image. It will be uploaded to Shopify."
                />
                {imageUrl && (
                  <div style={{ marginTop: '1rem', border: '1px solid #dfe3e8', padding: '1rem', borderRadius: '4px', textAlign: 'center' }}>
                    <img src={imageUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px' }} onError={(e) => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </BlockStack>
            </Card>

            {/* Pricing */}
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Pricing</Text>
                <FormLayout>
                  <FormLayout.Group>
                    <TextField
                      label="Price"
                      type="number"
                      value={price}
                      onChange={setPrice}
                      prefix="$"
                      autoComplete="off"
                      requiredIndicator
                      placeholder="0.00"
                    />
                    <TextField
                      label="Compare at price"
                      value=""
                      onChange={() => {}}
                      prefix="$"
                      autoComplete="off"
                      disabled
                      helpText="Feature coming soon"
                    />
                  </FormLayout.Group>
                </FormLayout>
              </BlockStack>
            </Card>

            {/* Inventory */}
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Inventory</Text>
                <FormLayout>
                  <FormLayout.Group>
                    <TextField
                      label="SKU (Stock Keeping Unit)"
                      value={sku}
                      onChange={setSku}
                      autoComplete="off"
                    />
                    <TextField
                      label="Barcode (ISBN, UPC, GTIN, etc.)"
                      value=""
                      onChange={() => {}}
                      autoComplete="off"
                      disabled
                      helpText="Feature coming soon"
                    />
                  </FormLayout.Group>
                </FormLayout>
              </BlockStack>
            </Card>

          </BlockStack>
        </Layout.Section>

        {/* RIGHT COLUMN */}
        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            
            {/* Status */}
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Status</Text>
                <Select
                  label="Product Status"
                  labelHidden
                  options={[
                    { label: 'Active', value: 'active' },
                    { label: 'Draft', value: 'draft' },
                  ]}
                  value={status}
                  onChange={setStatus}
                />
                <Text as="p" tone="subdued">
                  This product will be {status === 'active' ? 'visible' : 'hidden'} on your sales channels.
                </Text>
              </BlockStack>
            </Card>

            {/* Product Organization */}
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Product Organization</Text>
                <FormLayout>
                  <TextField
                    label="Product Category"
                    value={category}
                    onChange={setCategory}
                    autoComplete="off"
                    placeholder="e.g. Salwar Kameez"
                  />
                  <TextField
                    label="Vendor"
                    value={vendor}
                    onChange={setVendor}
                    autoComplete="off"
                  />
                </FormLayout>
              </BlockStack>
            </Card>

            {/* Online Store */}
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Theme template</Text>
                <Select
                  label="Template"
                  labelHidden
                  options={[
                    { label: 'Default product', value: 'default' },
                  ]}
                  value="default"
                  onChange={() => {}}
                  disabled
                />
              </BlockStack>
            </Card>

          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
