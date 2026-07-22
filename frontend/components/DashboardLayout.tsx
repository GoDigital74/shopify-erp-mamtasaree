'use client';

import React, { useState, useCallback } from 'react';
import { Frame, Navigation } from '@shopify/polaris';
import { HomeIcon, ProductIcon, OrderIcon, InventoryIcon, PersonIcon, SettingsIcon, ChartVerticalIcon, StoreIcon, ReceiptIcon } from '@shopify/polaris-icons';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const toggleMobileNavigationActive = useCallback(
    () => setMobileNavigationActive((active) => !active),
    [],
  );

  const navigation = (
    <Navigation location={pathname}>
      <Navigation.Section
        items={[
          {
            label: 'Dashboard',
            icon: HomeIcon,
            onClick: () => router.push('/'),
            selected: pathname === '/',
          },
          {
            label: 'Products',
            icon: ProductIcon,
            onClick: () => router.push('/products'),
            selected: pathname.startsWith('/products'),
          },
          {
            label: 'Orders',
            icon: OrderIcon,
            onClick: () => router.push('/orders'),
            selected: pathname.startsWith('/orders'),
          },
          {
            label: 'Inventory',
            icon: InventoryIcon,
            onClick: () => router.push('/inventory'),
            selected: pathname.startsWith('/inventory'),
          },
          {
            label: 'Customers',
            icon: PersonIcon,
            onClick: () => router.push('/customers'),
            selected: pathname.startsWith('/customers'),
          },
          {
            label: 'Analytics',
            icon: ChartVerticalIcon,
            onClick: () => router.push('/analytics'),
            selected: pathname.startsWith('/analytics'),
          },
          {
            label: 'Vendors',
            icon: StoreIcon,
            onClick: () => router.push('/vendors'),
            selected: pathname.startsWith('/vendors'),
          },
          {
            label: 'Purchase Orders',
            icon: ReceiptIcon,
            onClick: () => router.push('/purchase-orders'),
            selected: pathname.startsWith('/purchase-orders'),
          },
          {
            label: 'Settings',
            icon: SettingsIcon,
            onClick: () => router.push('/settings'),
            selected: pathname.startsWith('/settings'),
          },
        ]}
      />
    </Navigation>
  );

  return (
    <Frame
      navigation={navigation}
      showMobileNavigation={mobileNavigationActive}
      onNavigationDismiss={toggleMobileNavigationActive}
    >
      {children}
    </Frame>
  );
}
