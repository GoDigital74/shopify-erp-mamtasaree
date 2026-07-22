'use client';

import { useEffect, useState } from 'react';
import { Page, Layout, Card, IndexTable, Text, Spinner, Button, Modal, FormLayout, TextField, BlockStack } from '@shopify/polaris';
import { authenticatedFetch } from '@/lib/api';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Vendor Form State
  const [vendorName, setVendorName] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  async function fetchVendors() {
    try {
      const res = await authenticatedFetch('/api/vendors');
      if (res.ok) {
        const data = await res.json();
        setVendors(data);
      }
    } catch (err) {
      console.error('Failed to fetch vendors', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateVendor() {
    setSaving(true);
    try {
      const res = await authenticatedFetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: vendorName, email: vendorEmail })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setVendorName('');
        setVendorEmail('');
        fetchVendors(); // Refresh the list
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const rowMarkup = vendors.map((vendor, index) => (
    <IndexTable.Row id={vendor.id} key={vendor.id} position={index}>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold" as="span">
          {vendor.name}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        {vendor.email || 'N/A'}
      </IndexTable.Cell>
      <IndexTable.Cell>
        {new Date(vendor.createdAt).toLocaleDateString()}
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page 
      title="Vendors"
      primaryAction={{
        content: 'Add Vendor',
        onAction: () => setIsModalOpen(true),
      }}
    >
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <Spinner size="large" />
              </div>
            ) : (
              <IndexTable
                resourceName={{ singular: 'vendor', plural: 'vendors' }}
                itemCount={vendors.length}
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

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add a New Vendor"
        primaryAction={{
          content: 'Save',
          onAction: handleCreateVendor,
          loading: saving,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setIsModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Vendor Name"
              value={vendorName}
              onChange={setVendorName}
              autoComplete="off"
            />
            <TextField
              type="email"
              label="Vendor Email"
              value={vendorEmail}
              onChange={setVendorEmail}
              autoComplete="email"
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
