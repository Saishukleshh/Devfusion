'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Store, Shield, Sparkles, LayoutGrid, Eye } from 'lucide-react';

export default function RoleSwitcherNav() {
  const pathname = usePathname();

  const isCustomer = pathname.startsWith('/customer') || pathname === '/dashboard' || pathname === '/cart' || pathname === '/checkout';
  const isSeller = pathname.startsWith('/seller');
  const isAdmin = pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-50 px-4 md:px-8 py-3 bg-white/90 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="font-display font-extrabold text-xl tracking-tighter uppercase flex items-center gap-1.5">
          <span>VENDORVERSE</span>
          <span className="w-2 h-2 rounded-full bg-amber-600 inline-block"></span>
        </Link>

        {/* Universal Role Switcher Bar */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-full text-xs font-bold uppercase tracking-wider overflow-x-auto max-w-full">
          <span className="text-[9px] font-extrabold text-neutral-400 px-3 uppercase tracking-widest flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>Role View:</span>
          </span>

          <Link
            href="/customer"
            className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
              isCustomer ? 'bg-black text-white shadow-sm' : 'text-neutral-600 hover:text-black'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Customer</span>
          </Link>

          <Link
            href="/seller"
            className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
              isSeller ? 'bg-black text-white shadow-sm' : 'text-neutral-600 hover:text-black'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Seller</span>
          </Link>

          <Link
            href="/admin"
            className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
              isAdmin ? 'bg-black text-white shadow-sm' : 'text-neutral-600 hover:text-black'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Hub</span>
          </Link>

          <Link
            href="/importer"
            className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
              pathname === '/importer' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-700 hover:text-black'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Importer</span>
          </Link>
        </div>

        {/* Browse Catalog Link */}
        <Link
          href="/products"
          className="text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black flex items-center gap-1"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Browse Store</span>
        </Link>
      </div>
    </header>
  );
}
