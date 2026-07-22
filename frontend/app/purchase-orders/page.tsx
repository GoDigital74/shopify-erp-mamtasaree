'use client';

import { useEffect, useState } from 'react';
import { Page, Card, DataTable, BlockStack, Button, Modal, Select, TextField, FormLayout, Badge } from '@shopify/polaris';
import { authenticatedFetch } from '@/lib/api';

interface Vendor {
  id: string;
  name: string;
}

interface ProductVariant {
  id: string;
  title: string;
}

interface Product {
  id: string;
  title: string;
  variants: ProductVariant[];
}

interface PurchaseOrder {
  id: string;
  vendor?: { name: string };
  total: number;
  status: string;
  createdAt: string;
}

export default function PurchaseOrdersPage() {
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Create form state
  const [selectedVendor, setSelectedVendor] = useState('');
  const [total, setTotal] = useState('');

  // Receive form state
  const [selectedPo, setSelectedPo] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [receiveQuantity, setReceiveQuantity] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [poRes, vendorRes, prodRes] = await Promise.all([
        authenticatedFetch('/api/purchase-orders'),
        authenticatedFetch('/api/vendors'),
        authenticatedFetch('/api/products')
      ]);
      
      if (poRes.ok) setPos(await poRes.json());
      
      if (vendorRes.ok) {
        const vData: Vendor[] = await vendorRes.json();
        setVendors(vData);
        if (vData.length > 0 && !selectedVendor) {
          setSelectedVendor(vData[0].id);
        }
      }

      if (prodRes.ok) {
        const pData: Product[] = await prodRes.json();
        setProducts(pData);
        const firstVar = pData[0]?.variants?.[0]?.id;
        if (firstVar && !selectedVariant) {
          setSelectedVariant(firstVar);
        }
      }
    } catch (e) {
      console.error('Failed to load purchase orders data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePo = async () => {
    if (!selectedVendor || !total) return;
    setSubmitting(true);
    try {
      const res = await authenticatedFetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: selectedVendor, total: parseFloat(total) }),
      });
      if (res.ok) {
        setIsCreateOpen(false);
        setTotal('');
        fetchData();
      }
    } catch (e) {
      console.error('Failed to create purchase order', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceivePo = async () => {
    if (!selectedPo || !selectedVariant || !receiveQuantity) return;
    setSubmitting(true);
    try {
      const res = await authenticatedFetch(`/api/purchase-orders/${selectedPo}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: selectedVariant, quantity: parseInt(receiveQuantity, 10) }),
      });
      if (res.ok) {
        setIsReceiveOpen(false);
        setReceiveQuantity('');
        fetchData();
      }
    } catch (e) {
      console.error('Failed to receive inventory', e);
    } finally {
      setSubmitting(false);
    }
  };

  const rows = pos.map((po) => [
    po.id.substring(0, 8),
    po.vendor?.name || 'Unknown',
    `$${(po.total || 0).toFixed(2)}`,
    <Badge key={po.id} tone={po.status === 'received' ? 'success' : 'attention'}>{po.status}</Badge>,
    new Date(po.createdAt).toLocaleDateString(),
    po.status !== 'received' ? (
      <Button size="micro" key={`btn-${po.id}`} onClick={() => { setSelectedPo(po.id); setIsReceiveOpen(true); }}>Receive</Button>
    ) : null
  ]);

  const variantOptions = products.flatMap(p => 
    (p.variants || []).map((v) => ({
      label: `${p.title} - ${v.title}`,
      value: v.id
    }))
  );

  return (
    <Page 
      title="Purchase Orders"
      primaryAction={{
        content: 'Create PO',
        onAction: () => setIsCreateOpen(true),
      }}
    >
      <BlockStack gap="500">
        <Card padding="0">
          <DataTable
            columnContentTypes={['text', 'text', 'numeric', 'text', 'text', 'text']}
            headings={['PO ID', 'Vendor', 'Total', 'Status', 'Date', 'Action']}
            rows={rows}
          />
        </Card>
      </BlockStack>

      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Purchase Order"
        primaryAction={{
          content: 'Save',
          onAction: handleCreatePo,
          loading: submitting,
        }}
        secondaryActions={[{ content: 'Cancel', onAction: () => setIsCreateOpen(false) }]}
      >
        <Modal.Section>
          <FormLayout>
            <Select
              label="Vendor"
              options={vendors.map(v => ({ label: v.name, value: v.id }))}
              value={selectedVendor}
              onChange={setSelectedVendor}
            />
            <TextField
              label="Total Amount ($)"
              type="number"
              value={total}
              onChange={setTotal}
              autoComplete="off"
            />
          </FormLayout>
        </Modal.Section>
      </Modal>

      <Modal
        open={isReceiveOpen}
        onClose={() => setIsReceiveOpen(false)}
        title="Receive Inventory"
        primaryAction={{
          content: 'Receive',
          onAction: handleReceivePo,
          loading: submitting,
        }}
        secondaryActions={[{ content: 'Cancel', onAction: () => setIsReceiveOpen(false) }]}
      >
        <Modal.Section>
          <FormLayout>
            <Select
              label="Product Variant"
              options={variantOptions}
              value={selectedVariant}
              onChange={setSelectedVariant}
            />
            <TextField
              label="Quantity Received"
              type="number"
              value={receiveQuantity}
              onChange={setReceiveQuantity}
              autoComplete="off"
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
