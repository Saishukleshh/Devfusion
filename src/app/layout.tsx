import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VendorVerse | Premium Multi-Vendor Marketplace',
  description: 'Smart Multi-Vendor E-Commerce & Inventory Management Platform.',
  keywords: ['marketplace', 'e-commerce', 'multi-vendor', 'inventory', 'minimalist'],
  authors: [{ name: 'VendorVerse Team' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-white text-black selection:bg-neutral-200 selection:text-black">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#000000',
              color: '#ffffff',
              borderRadius: '0px',
              fontFamily: 'var(--font-inter)',
              fontSize: '14px',
              border: '1px solid #262626',
            },
          }}
        />
      </body>
    </html>
  );
}
