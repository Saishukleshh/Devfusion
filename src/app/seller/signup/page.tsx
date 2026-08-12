'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, ShoppingBag, Warehouse } from 'lucide-react';

export default function SellerSignupLanding() {
  return (
    <div className="min-h-screen bg-white text-black font-sans relative">
      <div className="noise-overlay" />
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 font-bold">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Seller Onboarding</span>
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-black uppercase tracking-tight leading-tight">
              Bring your inventory online with confidence.
            </h1>
            <p className="max-w-xl text-sm text-neutral-600 leading-relaxed">
              Create your vendor storefront, publish listings, manage stock, and accept orders from the VendorVerse marketplace. Our seller flow is built for speed, trust, and inventory accuracy.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-neutral-200 rounded-3xl p-6 bg-neutral-50 shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2">Fast Setup</p>
                <p className="text-sm font-semibold">List your first product in under 2 minutes.</p>
              </div>
              <div className="border border-neutral-200 rounded-3xl p-6 bg-neutral-50 shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2">Automated Inventory</p>
                <p className="text-sm font-semibold">Low-stock alerts and back-in-stock notifications keep your catalog fresh.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/signup?role=SELLER"
                className="border-brutal bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-wider rounded-xl shadow-brutal hover:bg-neutral-900 transition-colors"
              >
                Register as Seller
              </Link>
              <Link
                href="/seller/dashboard"
                className="border border-neutral-900 px-8 py-4 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-neutral-100 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Warehouse className="w-4 h-4" />
                Visit Seller Dashboard
              </Link>
            </div>
          </div>

          <div className="rounded-[3rem] overflow-hidden border border-neutral-200 shadow-xl bg-neutral-950 text-white min-h-[420px] p-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-neutral-300 uppercase tracking-[0.35em] text-[10px] font-bold">
                <span>Seller Tools</span>
              </div>
              <div className="space-y-3">
                <div className="rounded-3xl bg-neutral-900/90 p-5 border border-neutral-800">
                  <h2 className="text-sm uppercase tracking-widest text-neutral-400">Dashboard</h2>
                  <p className="mt-2 text-sm text-neutral-300">Order management, inventory updates, and sales visibility in one place.</p>
                </div>
                <div className="rounded-3xl bg-neutral-900/90 p-5 border border-neutral-800">
                  <h2 className="text-sm uppercase tracking-widest text-neutral-400">Product Listings</h2>
                  <p className="mt-2 text-sm text-neutral-300">Upload catalog items, add variants, and preview product details instantly.</p>
                </div>
                <div className="rounded-3xl bg-neutral-900/90 p-5 border border-neutral-800">
                  <h2 className="text-sm uppercase tracking-widest text-neutral-400">Smart Importer</h2>
                  <p className="mt-2 text-sm text-neutral-300">Convert supplier notes or CSV into catalog-ready product entries.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 rounded-3xl bg-amber-600 text-black">
              <p className="text-xs uppercase tracking-widest font-bold">Ready to launch?</p>
              <p className="mt-2 text-sm font-semibold leading-relaxed">Create your marketplace storefront, connect inventory, and start selling with confidence.</p>
              <Link href="/signup?role=SELLER" className="mt-4 inline-flex items-center justify-between w-full bg-black text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider">
                Start Seller Registration
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
