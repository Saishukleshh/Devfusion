'use client';

import React, { useState } from 'react';
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
  HelpCircle,
  Zap
} from 'lucide-react';
import Link from 'next/link';

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

const FAQS = [
  {
    q: "How does the AI Importer work?",
    a: "Sellers paste raw WhatsApp product photos and captions, or upload messy CSV files. Gemini 1.5 Flash extracts structured JSON listings (name, price, variants, stock) onto an editable review screen before live publishing."
  },
  {
    q: "How is overselling prevented during checkout?",
    a: "Checkout executes PostgreSQL atomic transactions with row locking (SELECT ... FOR UPDATE) to verify stock availability before capturing payment."
  },
  {
    q: "Are tax invoices provided for orders?",
    a: "Yes! Every order generates an itemized downloadable PDF/HTML tax invoice complete with GST breakdown and seller details."
  }
];

export default function LandingPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

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
      <div className="noise-overlay" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 px-4 md:px-8 py-4">
        <nav className="mx-auto max-w-7xl glass rounded-full px-6 py-3 flex items-center justify-between shadow-sm">
          <Link href="/" className="font-display font-extrabold text-2xl tracking-tighter flex items-center gap-1.5">
            <span>VENDORVERSE</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block animate-pulse"></span>
          </Link>

          <div className="hidden md:flex items-center gap-8 font-medium text-sm tracking-wide uppercase">
            <Link href="/products" className="hover:text-amber-600 transition-colors">Shop</Link>
            <Link href="/categories" className="hover:text-amber-600 transition-colors">Collections</Link>
            <Link href="/importer" className="flex items-center gap-1 hover:text-amber-600 transition-colors">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>AI Importer</span>
            </Link>
            <Link href="/about" className="hover:text-amber-600 transition-colors">Our Story</Link>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleDarkMode} 
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-full transition-colors"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? '🌞' : '🌙'}
            </button>

            <Link href="/cart" className="relative p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-full transition-colors">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute top-0 right-0 bg-amber-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">2</span>
            </Link>

            <Link href="/login" className="hidden sm:flex items-center gap-1.5 border border-black dark:border-white px-4 py-1.5 text-xs font-semibold uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">
              <User className="w-3.5 h-3.5" />
              <span>Login</span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 md:px-8 py-8 md:py-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
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
              <Link href="/products" className="flex items-center gap-2 border-brutal bg-black text-white px-8 py-4 font-bold uppercase tracking-wider text-xs shadow-brutal hover:bg-neutral-800 transition-all">
                <span>Explore Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/seller/signup" className="flex items-center gap-2 border border-neutral-300 dark:border-neutral-800 px-8 py-4 font-bold uppercase tracking-wider text-xs hover:border-black dark:hover:border-white transition-colors">
                <span>Register Store</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[400px] lg:min-h-[550px] border-brutal overflow-hidden rounded-2xl">
            <img 
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop" 
              alt="Vendor inventory" 
              className="absolute inset-0 w-full h-full object-cover grayscale contrast-[1.1]"
            />
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="px-4 md:px-8 py-16 bg-neutral-50 dark:bg-neutral-900/40 border-y border-neutral-200 dark:border-neutral-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-3xl font-extrabold uppercase mb-8">Popular Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CATEGORIES.map((cat) => (
              <div key={cat.slug} className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 rounded-xl">
                <img src={cat.img} alt={cat.name} className="w-full h-48 object-cover rounded-lg mb-3" />
                <h3 className="font-display font-bold uppercase text-base">{cat.name}</h3>
                <p className="text-xs text-neutral-500">{cat.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flash Deals & Best Sellers */}
      <section className="px-4 md:px-8 py-16 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <Zap className="w-6 h-6 text-amber-600" />
          <h2 className="font-display text-3xl font-extrabold uppercase">Flash Deals & Best Sellers</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BEST_SELLERS.map((prod) => (
            <div key={prod.id} className="border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl bg-white dark:bg-neutral-950 flex flex-col justify-between">
              <img src={prod.img} alt={prod.name} className="w-full h-48 object-cover rounded-lg mb-3" />
              <div>
                <h3 className="font-display font-bold text-sm uppercase">{prod.name}</h3>
                <p className="font-display font-extrabold text-amber-600 mt-1">{prod.price}</p>
              </div>
              <Link href={`/products/${prod.slug}`} className="mt-3 bg-black text-white py-2 rounded text-[10px] font-bold uppercase text-center block">
                View Item
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 md:px-8 py-16 bg-neutral-50 dark:bg-neutral-900/40 border-y border-neutral-200 dark:border-neutral-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-extrabold uppercase text-center mb-8">Seller Testimonials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="p-6 border border-neutral-200 bg-white rounded-2xl">
                <p className="text-xs italic text-neutral-600 mb-4">"{t.quote}"</p>
                <h4 className="font-display font-bold text-xs uppercase">{t.author} ({t.city})</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 md:px-8 py-16 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <HelpCircle className="w-6 h-6 text-amber-600" />
          <h2 className="font-display text-3xl font-extrabold uppercase">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-4">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="p-6 border border-neutral-200 rounded-2xl bg-white space-y-2">
              <h4 className="font-display font-bold text-sm uppercase">{faq.q}</h4>
              <p className="text-xs text-neutral-600 font-light leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="px-4 md:px-8 py-16 max-w-4xl mx-auto text-center border-t border-neutral-200">
        <Inbox className="w-10 h-10 text-neutral-400 mx-auto mb-4" />
        <h2 className="font-display text-2xl font-extrabold uppercase mb-2">Subscribe to Catalog Drops</h2>
        <p className="text-xs text-neutral-500 mb-6">Receive weekly catalog updates and flash deal notifications.</p>
        <form onSubmit={(e) => { e.preventDefault(); setSubscribed(true); }} className="flex max-w-md mx-auto gap-2">
          <input type="email" required placeholder="Enter email address" className="flex-1 border border-neutral-200 rounded-lg p-3 text-xs outline-none" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
          <button type="submit" className="bg-black text-white px-6 py-3 rounded-lg text-xs font-bold uppercase">Subscribe</button>
        </form>
        {subscribed && <p className="text-xs text-emerald-600 font-bold mt-2">Subscribed successfully!</p>}
      </section>

      {/* Footer */}
      <footer className="bg-black text-neutral-400 border-t border-neutral-900 py-12 px-4 md:px-8 text-center text-xs">
        <p>© 2026 VendorVerse. Built for DevFusion 4.0 Hackathon, IIT Bombay.</p>
      </footer>
    </div>
  );
}
