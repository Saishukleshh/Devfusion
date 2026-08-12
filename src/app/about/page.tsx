'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans relative">
      <div className="noise-overlay" />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_0.7fr] items-start">
          <div className="space-y-6">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">About VendorVerse</p>
            <h1 className="font-display text-5xl md:text-6xl font-black uppercase tracking-tight">Built for sellers, engineered for inventory accuracy.</h1>
            <p className="max-w-2xl text-sm text-neutral-600 leading-relaxed">
              VendorVerse is a modern multi-vendor marketplace designed to bring inventory-driven catalogs and order workflows together. Sellers can publish products with real stock levels, manage back-in-stock alerts, and keep every listing aligned with actual availability.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-neutral-200 p-6 bg-neutral-50 shadow-sm">
                <p className="text-xs uppercase tracking-widest text-neutral-400 font-bold">Our mission</p>
                <p className="mt-3 text-sm text-neutral-600">Create a marketplace where product availability is reliable and seller operations are transparent.</p>
              </div>
              <div className="rounded-3xl border border-neutral-200 p-6 bg-neutral-50 shadow-sm">
                <p className="text-xs uppercase tracking-widest text-neutral-400 font-bold">Seller-first</p>
                <p className="mt-3 text-sm text-neutral-600">Enable vendors to onboard quickly, sync inventory, and control their listings with ease.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/seller/signup" className="rounded-full border border-black px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors">
                Become a Seller
              </Link>
              <Link href="/importer" className="inline-flex items-center gap-2 rounded-full border border-amber-600 bg-amber-50 px-6 py-3 text-xs font-bold uppercase tracking-wider text-amber-800 hover:bg-amber-100 transition-colors">
                AI Catalog Importer
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-[3rem] overflow-hidden border border-neutral-200 bg-neutral-950 text-white p-10 shadow-xl">
            <div className="flex items-center gap-3 text-sm uppercase tracking-[0.35em] text-amber-400 font-bold mb-6">
              <Sparkles className="w-5 h-5" />
              Platform Highlights
            </div>
            <div className="space-y-5 text-sm leading-relaxed text-neutral-300">
              <p className="flex items-start gap-3"><ShieldCheck className="w-4 h-4 text-amber-400 mt-1" /> Inventory holds the source of truth for every listing and order.</p>
              <p className="flex items-start gap-3"><Sparkles className="w-4 h-4 text-amber-400 mt-1" /> Intelligent importer previews supplier data before it enters your catalog.</p>
              <p className="flex items-start gap-3"><ArrowRight className="w-4 h-4 text-amber-400 mt-1" /> Seller dashboard and order workflow management keep operations aligned.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
