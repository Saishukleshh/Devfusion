'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ShoppingBag, 
  Heart, 
  Menu, 
  X, 
  Search, 
  ChevronRight, 
  Star, 
  ArrowRight,
  Sparkles,
  Inbox,
  User,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

// Mock catalog data for the multi-vendor marketplace
const CATEGORIES = [
  { name: 'Trending Tech', count: '14 Products', slug: 'trending-tech', img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop' },
  { name: 'Connected Home', count: '8 Products', slug: 'connected-home', img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=600&auto=format&fit=crop' },
  { name: 'Marketplace Essentials', count: '12 Products', slug: 'marketplace-essentials', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop' },
];

const BEST_SELLERS = [
  {
    id: '1',
    name: 'Smart Barcode Scanner',
    slug: 'smart-barcode-scanner',
    category: 'Trending Tech',
    price: '₹8,999',
    compareAtPrice: '₹12,500',
    discount: '28% OFF',
    img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600&auto=format&fit=crop',
    rating: 4.9,
    reviews: 24,
    tags: ['Wireless', 'Inventory', 'Scanner'],
  },
  {
    id: '2',
    name: 'Modular Workbench Kit',
    slug: 'modular-workbench-kit',
    category: 'Marketplace Essentials',
    price: '₹4,500',
    img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop',
    rating: 4.8,
    reviews: 18,
    tags: ['Assembly', 'Storage', 'Modular'],
  },
  {
    id: '3',
    name: 'AI Inventory Display Panel',
    slug: 'ai-inventory-display-panel',
    category: 'Connected Home',
    price: '₹5,800',
    img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=600&auto=format&fit=crop',
    rating: 4.7,
    reviews: 12,
    tags: ['Smart', 'Dashboard', 'Realtime'],
  },
  {
    id: '4',
    name: 'Compact Shipping Scale',
    slug: 'compact-shipping-scale',
    category: 'Marketplace Essentials',
    price: '₹11,200',
    img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop',
    rating: 5.0,
    reviews: 8,
    tags: ['Precision', 'Logistics', 'Compact'],
  }
];

const TESTIMONIALS = [
  {
    quote: "The real-time inventory sync helped us avoid overselling during peak demand. The platform keeps vendor catalogs in line with actual stock without manual spreadsheets.",
    author: "Meera Varma",
    city: "Mumbai",
    rating: 5
  },
  {
    quote: "Importing supplier catalogs used to take days. VendorVerse turned messy WhatsApp notes into structured listings in minutes and kept pricing consistent.",
    author: "Aditya Shah",
    city: "New Delhi",
    rating: 5
  }
];

export default function LandingPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Toggle dark mode classes
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className={`relative min-h-screen ${isDarkMode ? 'dark bg-neutral-950 text-white' : 'bg-white text-black'} transition-colors duration-500`}>
      {/* Noise overlay texture */}
      <div className="noise-overlay" />

      {/* Floating Frosted Glass Navigation */}
      <header className="sticky top-0 z-50 px-4 md:px-8 py-4">
        <nav className="mx-auto max-w-7xl glass rounded-full px-6 py-3 flex items-center justify-between shadow-sm">
          {/* Logo with modern brutalist aesthetic */}
          <Link href="/" className="font-display font-extrabold text-2xl tracking-tighter flex items-center gap-1.5">
            <span>VENDORVERSE</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block animate-pulse"></span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 font-medium text-sm tracking-wide uppercase">
            <Link href="/products" className="hover:text-amber-600 transition-colors duration-300">Shop</Link>
            <Link href="/categories" className="hover:text-amber-600 transition-colors duration-300">Collections</Link>
            <Link href="/importer" className="flex items-center gap-1 hover:text-amber-600 transition-colors duration-300">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>AI Importer</span>
            </Link>
            <Link href="/about" className="hover:text-amber-600 transition-colors duration-300">Our Story</Link>
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-4">
            {/* Search input - desktop */}
            <div className="hidden lg:flex items-center border border-neutral-300 dark:border-neutral-800 rounded-full px-3 py-1 bg-white/50 dark:bg-black/50">
              <Search className="w-4 h-4 text-neutral-400 mr-2" />
              <input 
                type="text" 
                placeholder="Search catalog..." 
                className="bg-transparent border-none outline-none text-xs w-32 focus:w-48 transition-all duration-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Dark mode toggler */}
            <button 
              onClick={toggleDarkMode} 
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-full transition-colors duration-300"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? '🌞' : '🌙'}
            </button>

            {/* Cart & Auth Link */}
            <Link href="/cart" className="relative p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-full transition-colors duration-300">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute top-0 right-0 bg-amber-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">2</span>
            </Link>

            <Link href="/login" className="hidden sm:flex items-center gap-1.5 border border-black dark:border-white px-4 py-1.5 text-xs font-semibold uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-300">
              <User className="w-3.5 h-3.5" />
              <span>Login</span>
            </Link>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="md:hidden p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-full"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white dark:bg-neutral-950 pt-24 px-6 transition-all duration-300">
          <div className="flex flex-col gap-6 font-display text-2xl uppercase tracking-tighter">
            <Link href="/products" onClick={() => setIsMobileMenuOpen(false)}>Shop</Link>
            <Link href="/categories" onClick={() => setIsMobileMenuOpen(false)}>Collections</Link>
            <Link href="/importer" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 text-amber-600">
              <Sparkles className="w-5 h-5" />
              <span>AI Importer</span>
            </Link>
            <Link href="/about" onClick={() => setIsMobileMenuOpen(false)}>Our Story</Link>
            <hr className="border-neutral-200 dark:border-neutral-800" />
            <Link href="/login" className="text-lg">Login / Register</Link>
            <Link href="/seller/signup" className="text-lg text-neutral-500">Become a Seller</Link>
          </div>
        </div>
      )}

      {/* Hero Section - Apple Elegance & COS Brutalism */}
      <section className="relative px-4 md:px-8 py-8 md:py-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Hero text */}
          <div className="lg:col-span-7 flex flex-col justify-between py-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="h-px w-8 bg-neutral-400"></span>
                <span className="uppercase text-xs tracking-widest text-neutral-500 font-bold">DevFusion 4.0 Spotlight</span>
              </div>
              <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tighter uppercase mb-6">
                SMART INVENTORY.<br />
                DIRECT FROM<br />
                <span className="text-amber-600">THE SELLER.</span>
              </h1>
              <p className="max-w-md text-neutral-600 dark:text-neutral-400 text-sm md:text-base mb-8 font-light leading-relaxed">
                A structured marketplace connecting local vendors, live inventory, and intelligent order fulfillment. Built for sellers who need catalog accuracy and buyers who want trust.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Link href="/products" className="group flex items-center gap-2 border-brutal bg-black text-white px-8 py-4 font-bold uppercase tracking-wider text-xs shadow-brutal hover-shadow-brutal transition-all duration-300">
                <span>Explore Catalog</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/seller/signup" className="flex items-center gap-2 border border-neutral-300 dark:border-neutral-800 px-8 py-4 font-bold uppercase tracking-wider text-xs hover:border-black dark:hover:border-white transition-colors duration-300">
                <span>Register Store</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Immersive Lifestyle Photo (Asymmetrical Brutalist block) */}
          <div className="lg:col-span-5 relative min-h-[400px] lg:min-h-[550px] border-brutal overflow-hidden group">
            <img 
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop" 
              alt="Modern vendor inventory operations hub" 
              className="absolute inset-0 w-full h-full object-cover grayscale contrast-[1.1] transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-neutral-900/10 mix-blend-multiply" />
            <div className="absolute bottom-6 left-6 right-6 bg-white dark:bg-neutral-950 p-4 border border-black dark:border-neutral-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-400">Featured Network</p>
                <h4 className="font-display font-bold uppercase text-sm">Vendor Network Hub</h4>
              </div>
              <span className="text-xs font-semibold underline uppercase">Explore Stores</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collections Section */}
      <section className="px-4 md:px-8 py-16 bg-neutral-50 dark:bg-neutral-900/40 border-y border-neutral-200 dark:border-neutral-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs uppercase tracking-widest text-neutral-400 font-bold mb-2">Curated Spaces</p>
              <h2 className="font-display text-3xl md:text-5xl font-extrabold uppercase tracking-tight">Featured Collections</h2>
            </div>
            <Link href="/categories" className="hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider hover:text-amber-600 transition-colors">
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Asymmetric Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CATEGORIES.map((cat, idx) => (
              <div 
                key={cat.slug} 
                className={`relative border border-neutral-200 dark:border-neutral-800 overflow-hidden group bg-white dark:bg-neutral-950 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ${idx === 1 ? 'md:-translate-y-4' : ''}`}
              >
                <div className="h-64 overflow-hidden relative mb-4 rounded-lg">
                  <img 
                    src={cat.img} 
                    alt={cat.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-lg uppercase">{cat.name}</h3>
                    <p className="text-xs text-neutral-500">{cat.count}</p>
                  </div>
                  <Link 
                    href={`/categories/${cat.slug}`}
                    className="w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-800 flex items-center justify-center group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors duration-300"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="px-4 md:px-8 py-20 max-w-7xl mx-auto">
        <div className="text-center max-w-lg mx-auto mb-16">
          <p className="text-xs uppercase tracking-widest text-neutral-400 font-bold mb-2">Platform Favorites</p>
          <h2 className="font-display text-3xl md:text-5xl font-extrabold uppercase tracking-tight">Best Sellers</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-3 leading-relaxed">
            The most sought-after items crafted by our vetted creators, backed by atomic inventory sync to guarantee delivery.
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BEST_SELLERS.map((prod) => (
            <div 
              key={prod.id} 
              className="border border-neutral-200 dark:border-neutral-900 group relative flex flex-col justify-between bg-white dark:bg-neutral-950 p-4 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              {/* Product Image and Discount tag */}
              <div className="relative h-80 overflow-hidden mb-4 rounded-lg bg-neutral-100 dark:bg-neutral-900">
                <img 
                  src={prod.img} 
                  alt={prod.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                {prod.discount && (
                  <span className="absolute top-3 left-3 bg-amber-600 text-white font-bold text-[9px] uppercase tracking-wider px-2 py-1 rounded">
                    {prod.discount}
                  </span>
                )}
                
                {/* Wishlist Icon */}
                <button className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-black/80 rounded-full hover:bg-amber-600 hover:text-white transition-colors duration-300">
                  <Heart className="w-4 h-4" />
                </button>
              </div>

              {/* Product Info */}
              <div>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest mb-1">{prod.category}</p>
                <Link href={`/products/${prod.slug}`}>
                  <h3 className="font-display font-bold text-sm uppercase tracking-tight group-hover:text-amber-600 transition-colors duration-300">
                    {prod.name}
                  </h3>
                </Link>

                {/* Rating */}
                <div className="flex items-center gap-1 mt-1 mb-2">
                  <Star className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500" />
                  <span className="text-[11px] font-bold">{prod.rating}</span>
                  <span className="text-[10px] text-neutral-400">({prod.reviews} reviews)</span>
                </div>
              </div>

              {/* Price & Cart CTA */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-900">
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-extrabold text-base">{prod.price}</span>
                  {prod.compareAtPrice && (
                    <span className="text-xs text-neutral-400 line-through font-light">{prod.compareAtPrice}</span>
                  )}
                </div>
                <Link 
                  href={`/products/${prod.slug}`}
                  className="text-xs font-bold uppercase tracking-wider text-black dark:text-white flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                >
                  <span>Select Size</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Editorial Campaign / Storytelling Section - Aesop Vibe */}
      <section className="px-4 md:px-8 py-24 bg-neutral-950 text-white border-y border-neutral-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Imagery */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="overflow-hidden border border-neutral-800 rounded-lg">
              <img 
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=500&auto=format&fit=crop" 
                alt="Sewing machine details" 
                className="w-full h-80 object-cover grayscale transition-transform duration-700 hover:scale-105"
              />
            </div>
            <div className="overflow-hidden border border-neutral-800 rounded-lg translate-y-8">
              <img 
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=500&auto=format&fit=crop" 
                alt="Tailor table" 
                className="w-full h-80 object-cover grayscale transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>

          {/* Storytelling Text */}
          <div className="lg:col-span-6 lg:pl-8 flex flex-col justify-center">
            <span className="text-xs uppercase tracking-widest text-amber-500 font-bold mb-3">Our Core Philosophy</span>
            <h2 className="font-display text-4xl md:text-5xl font-black leading-tight uppercase mb-6">
              VETTED ARTISANRY,<br />
              NO INTERMEDIARIES.
            </h2>
            <div className="space-y-4 text-neutral-400 text-sm font-light leading-relaxed">
              <p>
                Every listing on VendorVerse is authenticated directly from the maker’s workshop. We bypass traditional distribution agents, wholesaling filters, and massive markups to ensure 85% of each transaction goes straight to the creator.
              </p>
              <p>
                By digitizing local inventories directly from simple WhatsApp logs using state-of-the-art AI parsing, we allow craftsmen in small clusters to list live products with variant structures and real-time stock sync in less than 30 seconds.
              </p>
            </div>
            
            <div className="mt-8 flex items-center gap-6">
              <div>
                <p className="font-display text-3xl font-bold text-white">85%</p>
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Seller Revenue Share</p>
              </div>
              <div className="h-8 w-px bg-neutral-800" />
              <div>
                <p className="font-display text-3xl font-bold text-white">&lt; 30s</p>
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest">AI Importer Speed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Showcase Product with Sticky CTA behavior */}
      <section className="px-4 md:px-8 py-20 max-w-7xl mx-auto">
        <div className="border border-neutral-200 dark:border-neutral-900 rounded-2xl p-6 md:p-12 bg-neutral-50/50 dark:bg-neutral-900/20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
            {/* Carousel Images */}
            <div className="lg:col-span-6 border-brutal overflow-hidden bg-neutral-100 dark:bg-neutral-950 aspect-[4/5] rounded-xl relative group">
              <img 
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=700&auto=format&fit=crop" 
                alt="Smart inventory scanner on a vendor workstation" 
                className="w-full h-full object-cover grayscale group-hover:scale-105 transition-transform duration-1000"
              />
              <span className="absolute top-4 left-4 bg-black text-white font-bold text-[9px] uppercase tracking-widest px-3 py-1.5">
                Marketplace Spotlight
              </span>
            </div>

            {/* Showcase Details */}
            <div className="lg:col-span-6">
              <p className="text-xs uppercase tracking-widest text-neutral-400 font-bold mb-1">Featured Product</p>
              <h2 className="font-display text-3xl md:text-4xl font-extrabold uppercase tracking-tight mb-4">
                Smart Inventory Scanner
              </h2>
              
              <div className="flex items-center gap-3 mb-6">
                <span className="font-display text-2xl font-black text-amber-600">₹8,999</span>
                <span className="text-sm text-neutral-400 line-through font-light">₹12,500</span>
                <span className="text-xs bg-amber-600/10 text-amber-600 font-bold px-2 py-0.5 rounded">28% OFF</span>
              </div>

              <p className="text-neutral-600 dark:text-neutral-400 text-sm font-light leading-relaxed mb-6">
                A compact wireless inventory scanner built for modern marketplaces. Syncs stock updates instantly, simplifies order batching, and reduces fulfillment errors.
              </p>

              {/* Variant selections (Modes) */}
              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-wider mb-3">Connection Mode</p>
                <div className="flex gap-3">
                  {['Wi-Fi', 'Bluetooth', 'USB'].map((mode) => (
                    <button 
                      key={mode} 
                      className="border border-neutral-300 dark:border-neutral-800 hover:border-black dark:hover:border-white text-xs font-bold px-4 h-12 flex items-center justify-center transition-colors"
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive add call */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/products/smart-barcode-scanner" className="flex-1 text-center border-brutal bg-black text-white px-8 py-4 font-bold uppercase tracking-wider text-xs hover:bg-neutral-800 transition-colors shadow-sm">
                  View Full Product Details
                </Link>
                <button className="border border-neutral-300 dark:border-neutral-800 p-4 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-xl transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Carousel Section */}
      <section className="px-4 md:px-8 py-20 bg-neutral-50 dark:bg-neutral-900/40 border-y border-neutral-200 dark:border-neutral-900 transition-colors duration-300">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs uppercase tracking-widest text-neutral-400 font-bold mb-6">Collector Voices</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 mb-4">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500 stroke-amber-500" />
                    ))}
                  </div>
                  <p className="font-display font-light text-lg leading-relaxed text-neutral-700 dark:text-neutral-300 italic mb-6">
                    "{t.quote}"
                  </p>
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm uppercase">{t.author}</h4>
                  <p className="text-xs text-neutral-400">{t.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="px-4 md:px-8 py-24 max-w-4xl mx-auto text-center">
        <Inbox className="w-12 h-12 text-neutral-300 dark:text-neutral-800 mx-auto mb-6" />
        <h2 className="font-display text-3xl md:text-4xl font-extrabold uppercase tracking-tight mb-4">
          Join the Dispatch
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm font-light max-w-md mx-auto mb-8 leading-relaxed">
          Weekly profiles on emerging makers, product capsule drops, and early-access catalogs.
        </p>

        {subscribed ? (
          <div className="max-w-md mx-auto p-4 border border-amber-600/30 bg-amber-600/5 rounded-lg flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <p className="text-xs font-semibold text-amber-600">You have been subscribed to the VendorVerse dispatch.</p>
          </div>
        ) : (
          <form 
            onSubmit={(e) => { e.preventDefault(); if (emailInput) setSubscribed(true); }}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input 
              type="email" 
              placeholder="Enter your email address" 
              required
              className="flex-1 border border-neutral-300 dark:border-neutral-800 rounded-lg px-4 py-3 text-sm bg-transparent outline-none focus:border-black dark:focus:border-white transition-colors"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <button 
              type="submit" 
              className="border-brutal bg-black text-white px-6 py-3 font-bold uppercase tracking-wider text-xs shadow-brutal hover:bg-neutral-800 transition-all duration-300"
            >
              Subscribe
            </button>
          </form>
        )}
      </section>

      {/* Footer Section */}
      <footer className="bg-black text-neutral-400 border-t border-neutral-900 py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo & Platform Info */}
          <div className="md:col-span-1">
            <h3 className="font-display font-extrabold text-xl text-white tracking-tighter uppercase mb-4">
              VENDORVERSE
            </h3>
            <p className="text-xs font-light leading-relaxed mb-6">
              Smart Multi-Vendor E-Commerce & Inventory Management Platform. Built for DevFusion 4.0 Hackathon, IIT Bombay.
            </p>
            <p className="text-[10px] text-neutral-600">
              © 2026 VendorVerse. All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-bold text-xs text-white uppercase tracking-widest mb-4">Catalog</h4>
            <div className="flex flex-col gap-2.5 text-xs font-light">
              <Link href="/products" className="hover:text-white transition-colors">All Products</Link>
              <Link href="/categories/trending-tech" className="hover:text-white transition-colors">Trending Tech</Link>
              <Link href="/categories/connected-home" className="hover:text-white transition-colors">Connected Home</Link>
              <Link href="/categories/marketplace-essentials" className="hover:text-white transition-colors">Marketplace Essentials</Link>
            </div>
          </div>

          {/* Seller Resources */}
          <div>
            <h4 className="font-display font-bold text-xs text-white uppercase tracking-widest mb-4">Makers</h4>
            <div className="flex flex-col gap-2.5 text-xs font-light">
              <Link href="/seller/signup" className="hover:text-white transition-colors">Register as Seller</Link>
              <Link href="/importer" className="hover:text-white transition-colors">AI Catalog Importer</Link>
              <Link href="/seller/dashboard" className="hover:text-white transition-colors">Seller Dashboard</Link>
              <Link href="/about" className="hover:text-white transition-colors">Fair-Trade Policy</Link>
            </div>
          </div>

          {/* Hackathon Specs */}
          <div>
            <h4 className="font-display font-bold text-xs text-white uppercase tracking-widest mb-4">Verification Specs</h4>
            <div className="flex flex-col gap-2.5 text-xs font-light">
              <span className="flex items-center gap-1 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>Prisma Client generated</span>
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>Supabase Auth session active</span>
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>Realtime Stock Listener</span>
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse"></span>
                <span>Razorpay Test Integration</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
