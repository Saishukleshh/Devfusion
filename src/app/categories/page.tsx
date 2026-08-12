'use client';

import Link from 'next/link';
import { ChevronRight, Sparkles, Grid } from 'lucide-react';

const CATEGORIES = [
  { name: 'Electronics', description: 'Smart devices, tools, and warehouse automation supplies.', slug: 'electronics' },
  { name: 'Supplies', description: 'Packaging, labels, tools, and inventory essentials.', slug: 'supplies' },
  { name: 'Books', description: 'Business manuals, logistics guides, and inventory references.', slug: 'books' },
  { name: 'Home Decor', description: 'Warehouse furnishings, fixtures, and supplier displays.', slug: 'home-decor' },
  { name: 'Furniture', description: 'Storage racks, workbenches, and assembly solutions.', slug: 'furniture' },
  { name: 'Sports', description: 'Gear, fitness inventory, and organization solutions.', slug: 'sports' },
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans relative">
      <div className="noise-overlay" />
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-16">
        <div className="flex flex-col gap-4 mb-10">
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Browse Collections</p>
          <h1 className="font-display text-5xl md:text-6xl font-black uppercase tracking-tight">Marketplace Categories</h1>
          <p className="max-w-2xl text-sm text-neutral-600 leading-relaxed">
            Discover supplier verticals and curated collections for your business. Sell or source goods across inventory, logistics, and industrial categories.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className="rounded-3xl border border-neutral-200 p-8 bg-neutral-50 shadow-sm transition hover:border-black hover:bg-white"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-display text-2xl font-black uppercase tracking-tight">{category.name}</h2>
                  <p className="text-sm text-neutral-500 mt-2">{category.description}</p>
                </div>
                <ChevronRight className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Explore {category.name}</div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
