import type { Metadata } from 'next';
import Script from 'next/script';
import Providers from './Providers';
import DashboardLayout from '@/components/DashboardLayout';
import './globals.css';

export const metadata: Metadata = {
  title: 'iNext ERP Dashboard',
  description: 'Shopify ERP Integration Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '';

  return (
    <html lang="en">
      <head>
        <meta name="shopify-api-key" content={apiKey} />
        <Script
          src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <Providers>
          <DashboardLayout>{children}</DashboardLayout>
        </Providers>
      </body>
    </html>
  );
}