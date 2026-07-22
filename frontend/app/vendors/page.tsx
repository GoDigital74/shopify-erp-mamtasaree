'use client';

import { useEffect, useState } from 'react';
import { Page, Card, DataTable, BlockStack, Button, InlineStack, Modal, TextField, FormLayout } from '@shopify/polaris';
import { authenticatedFetch } from '@/lib/api';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New vendor form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch('/api/vendors');
      if (res.ok) {
        const data = await res.json();
        setVendors(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVendor = async () => {
    setSubmitting(true);
    try {
      const res = await authenticatedFetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setName('');
        setEmail('');
        fetchVendors();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const rows = vendors.map((vendor) => [
    vendor.name,
    vendor.email || 'N/A',
    new Date(vendor.createdAt).toLocaleDateString(),
  ]);

  return (
    <Page 
      title="Vendors"
      primaryAction={{
        content: 'Add Vendor',
        onAction: () => setIsModalOpen(true),
      }}
    >
      <BlockStack gap="500">
        <Card padding="0">
          <DataTable
            columnContentTypes={['text', 'text', 'text']}
            headings={['Name', 'Email', 'Created']}
            rows={rows}
          />
        </Card>
      </BlockStack>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add new vendor"
        primaryAction={{
          content: 'Save',
          onAction: handleCreateVendor,
          loading: submitting,
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
              value={name}
              onChange={setName}
              autoComplete="off"
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

