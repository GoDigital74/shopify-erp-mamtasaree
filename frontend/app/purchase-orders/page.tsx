'use client';

import { useEffect, useState } from 'react';
import { Page, Layout, Card, IndexTable, Text, Spinner, Badge, Button, Modal, FormLayout, Select, TextField } from '@shopify/polaris';
import { authenticatedFetch } from '@/lib/api';

export default function PurchaseOrdersPage() {
  const [pos, setPos] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vendorId, setVendorId] = useState('');
  const [total, setTotal] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [posRes, vendorsRes] = await Promise.all([
        authenticatedFetch('/api/purchase-orders'),
        authenticatedFetch('/api/vendors')
      ]);
      
      if (posRes.ok) setPos(await posRes.json());
      if (vendorsRes.ok) {
        const vData = await vendorsRes.json();
        setVendors(vData);
        if (vData.length > 0) setVendorId(vData[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch POs', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePO() {
    setSaving(true);
    try {
      const res = await authenticatedFetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, total: parseFloat(total) || 0 })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setTotal('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleReceivePO(id: string) {
    try {
      // For demo, we just mark as received without specific line items.
      // A full implementation would specify variantId and quantity.
      const res = await authenticatedFetch(`/api/purchase-orders/${id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  }

  const rowMarkup = pos.map((po, index) => (
    <IndexTable.Row id={po.id} key={po.id} position={index}>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold" as="span">
          {po.id.slice(0, 8).toUpperCase()}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        {po.vendor?.name || 'Unknown'}
      </IndexTable.Cell>
      <IndexTable.Cell>
        ${po.total.toFixed(2)}
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={po.status === 'received' ? 'success' : 'attention'}>
          {po.status}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        {po.status === 'draft' ? (
          <Button size="micro" onClick={() => handleReceivePO(po.id)}>Mark Received</Button>
        ) : (
          <Text variant="bodySm" tone="subdued" as="span">{new Date(po.updatedAt).toLocaleDateString()}</Text>
        )}
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  const vendorOptions = vendors.map(v => ({ label: v.name, value: v.id }));

  return (
    <Page 
      title="Purchase Orders"
      primaryAction={{
        content: 'Create PO',
        onAction: () => setIsModalOpen(true),
        disabled: vendors.length === 0,
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
                resourceName={{ singular: 'purchase order', plural: 'purchase orders' }}
                itemCount={pos.length}
                headings={[
                  { title: 'PO ID' },
                  { title: 'Vendor' },
                  { title: 'Total Amount' },
                  { title: 'Status' },
                  { title: 'Action / Date' },
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
        title="Create Purchase Order"
        primaryAction={{
          content: 'Save',
          onAction: handleCreatePO,
          loading: saving,
        }}
        secondaryActions={[{ content: 'Cancel', onAction: () => setIsModalOpen(false) }]}
      >
        <Modal.Section>
          <FormLayout>
            <Select
              label="Select Vendor"
              options={vendorOptions}
              value={vendorId}
              onChange={setVendorId}
            />
            <TextField
              label="Total Amount"
              type="number"
              value={total}
              onChange={setTotal}
              prefix="$"
              autoComplete="off"
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
