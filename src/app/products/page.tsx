'use client';

import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, SlidersHorizontal, Grid, List, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  discount: number;
  avgRating: number;
  totalReviews: number;
  images: string[];
  category: { name: string; slug: string };
  store: { name: string };
  variants: any[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('latest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
  // Available filters (Mocking selection values based on seeded data)
  const categoriesList = [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Supplies', slug: 'supplies' },
    { name: 'Books', slug: 'books' },
    { name: 'Groceries', slug: 'groceries' },
    { name: 'Home Decor', slug: 'home-decor' },
    { name: 'Beauty', slug: 'beauty' },
    { name: 'Sports', slug: 'sports' },
    { name: 'Furniture', slug: 'furniture' },
  ];

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (sort) params.append('sort', sort);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 400); // Debounce inputs
    return () => clearTimeout(delayDebounce);
  }, [search, category, sort, minPrice, maxPrice]);

  return (
    <div className="min-h-screen bg-white text-black font-sans relative">
      <div className="noise-overlay" />

      {/* Floating Glass Navigation */}
      <header className="sticky top-0 z-50 px-4 md:px-8 py-4">
        <nav className="mx-auto max-w-7xl glass rounded-full px-6 py-3 flex items-center justify-between shadow-sm">
          <Link href="/" className="font-display font-extrabold text-2xl tracking-tighter uppercase">
            VENDORVERSE
          </Link>
          <div className="flex gap-4">
            <Link href="/" className="text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-black">Home</Link>
            <Link href="/importer" className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-600">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Importer</span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Header Banner */}
      <section className="px-4 md:px-8 py-12 max-w-7xl mx-auto border-b border-neutral-100">
        <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Collections</span>
        <h1 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tight mt-2">All Products</h1>
      </section>

      {/* Catalog Search, Filters and Grid Layout */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Filters column */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-xs border-b border-black pb-3">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </div>

          {/* Search box */}
          <div className="relative border border-neutral-200 rounded-lg p-2 flex items-center">
            <Search className="w-4 h-4 text-neutral-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-xs w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Categories select */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Category</h4>
            <select 
              className="w-full border border-neutral-200 rounded-lg p-3 text-xs bg-white"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat.slug} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Price Range (₹)</h4>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="number" 
                placeholder="Min"
                className="w-full border border-neutral-200 rounded-lg p-2.5 text-xs text-center"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <input 
                type="number" 
                placeholder="Max"
                className="w-full border border-neutral-200 rounded-lg p-2.5 text-xs text-center"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Sorter */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Sort By</h4>
            <select 
              className="w-full border border-neutral-200 rounded-lg p-3 text-xs bg-white"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="latest">Latest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="popularity">Popularity</option>
              <option value="rating">Rating</option>
            </select>
          </div>
        </aside>

        {/* Right Products column */}
        <section className="lg:col-span-9">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse border border-neutral-100 rounded-xl p-4 space-y-4">
                  <div className="bg-neutral-100 h-64 w-full rounded-lg"></div>
                  <div className="h-4 bg-neutral-100 rounded w-2/3"></div>
                  <div className="h-4 bg-neutral-100 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 border border-neutral-100 rounded-2xl bg-neutral-50/50">
              <p className="text-sm text-neutral-400 font-light mb-4">No listings found matching the select criteria.</p>
              <button 
                onClick={() => { setSearch(''); setCategory(''); setMinPrice(''); setMaxPrice(''); }}
                className="text-xs font-bold uppercase tracking-wider border border-black px-6 py-2.5"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((prod) => {
                const displayPrice = (prod.price / 100).toLocaleString('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                });
                return (
                  <div 
                    key={prod.id} 
                    className="border border-neutral-200 group flex flex-col justify-between bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="relative h-64 overflow-hidden mb-4 rounded-lg bg-neutral-100">
                      <img 
                        src={prod.images[0] || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=600&auto=format&fit=crop'} 
                        alt={prod.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                    </div>
                    <div>
                      <p className="text-[9px] text-neutral-400 uppercase tracking-widest mb-1">{prod.category?.name}</p>
                      <Link href={`/products/${prod.slug}`}>
                        <h3 className="font-display font-bold text-sm uppercase tracking-tight group-hover:text-amber-600 transition-colors">
                          {prod.name}
                        </h3>
                      </Link>
                      <p className="text-[10px] text-neutral-500 font-light mt-1">by {prod.store?.name}</p>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
                      <span className="font-display font-black text-sm">{displayPrice}</span>
                      <Link 
                        href={`/products/${prod.slug}`}
                        className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                      >
                        <span>Select Options</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
