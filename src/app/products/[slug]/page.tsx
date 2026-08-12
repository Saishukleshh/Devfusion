'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, ShoppingBag, Heart, Loader2, ArrowLeft, Calendar, Sparkles } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Variant {
  id: string;
  type: string;
  value: string;
  price: number | null;
  stock: number;
  lowStockThreshold: number;
  restockEta: string | null;
  restockNote: string | null;
}

interface ProductDetail {
  id: string;
  name: string;
  description: string;
  brand: string;
  price: number; // in paise
  images: string[];
  avgRating: number;
  totalReviews: number;
  shippingCharge: number;
  category: { name: string };
  store: { name: string; id: string };
  variants: Variant[];
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProductDetail = async () => {
    try {
      const res = await fetch(`/api/products/${slug}`);
      const data = await res.json();
      if (data.success) {
        setProduct(data.product);
        // Default to first variant
        if (data.product.variants && data.product.variants.length > 0) {
          setSelectedVariant(data.product.variants[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
      toast.error('Failed to load product details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchProductDetail();
  }, [slug]);

  // Helper to calculate relative restock ETA text
  const getRestockEtaText = (etaStr: string | null, noteStr: string | null) => {
    if (etaStr) {
      const etaDate = new Date(etaStr);
      const diffTime = etaDate.getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) return 'Back in stock today';
      if (diffDays === 1) return 'Back in stock tomorrow';
      return `Back in stock in ${diffDays} days`;
    }
    if (noteStr) {
      return `Back in stock ${noteStr}`;
    }
    return 'Currently out of stock — check back soon';
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    setActionLoading(true);

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: selectedVariant.id,
          quantity: 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Please log in to add items to cart.');
          router.push(`/login?redirectTo=/products/${slug}`);
          return;
        }
        throw new Error(data.error || 'Failed to add item to cart');
      }

      toast.success('Added to cart successfully.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!product) return;
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Please log in to manage wishlist.');
          router.push(`/login?redirectTo=/products/${slug}`);
          return;
        }
        throw new Error(data.error || 'Failed to update wishlist');
      }

      toast.success('Added to wishlist successfully.');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-black p-4">
        <p className="text-sm text-neutral-400 mb-4">Product not found.</p>
        <Link href="/products" className="border border-black px-6 py-2.5 text-xs font-bold uppercase tracking-wider">
          Browse Catalog
        </Link>
      </div>
    );
  }

  // Determine current active display price (variant override vs product base price)
  const currentPricePaise = selectedVariant && selectedVariant.price !== null ? selectedVariant.price : product.price;
  const displayPrice = (currentPricePaise / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

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
            <Link href="/products" className="text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-black">Catalog</Link>
            <Link href="/cart" className="text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-black">Cart</Link>
          </div>
        </nav>
      </header>

      {/* Main product columns */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <Link href="/products" className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-black font-bold uppercase tracking-wider mb-8">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Catalog</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Product Image Gallery */}
          <div className="lg:col-span-6 relative border border-neutral-200 overflow-hidden bg-neutral-50 aspect-[4/5] rounded-xl">
            <img 
              src={product.images[0] || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=700&auto=format&fit=crop'} 
              alt={product.name} 
              className="w-full h-full object-cover grayscale contrast-[1.05]"
            />
          </div>

          {/* Right Column: Listing Details */}
          <div className="lg:col-span-6">
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
              {product.category?.name}
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-extrabold uppercase tracking-tight mt-2 mb-3">
              {product.name}
            </h1>

            {/* Vetted Store details */}
            <div className="flex items-center gap-1.5 mb-6 text-xs text-neutral-500">
              <span>Listed by</span>
              <span className="font-semibold text-black underline">{product.store?.name}</span>
            </div>

            {/* Rating summary */}
            <div className="flex items-center gap-1 mb-6">
              <Star className="w-4 h-4 fill-amber-500 stroke-amber-500" />
              <span className="text-xs font-bold">{product.avgRating.toFixed(1)}</span>
              <span className="text-xs text-neutral-400">({product.totalReviews} reviews)</span>
            </div>

            {/* Price display */}
            <div className="font-display text-3xl font-black text-amber-600 mb-8">
              {displayPrice}
            </div>

            {/* Description */}
            <div className="text-neutral-600 font-light text-sm leading-relaxed mb-8">
              {product.description}
            </div>

            {/* Variants configuration selection */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-wider mb-3">Select {product.variants[0]?.type}</p>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((v) => (
                    <button 
                      key={v.id} 
                      onClick={() => setSelectedVariant(v)}
                      className={`border rounded-lg text-xs font-bold px-5 py-3.5 transition-all ${selectedVariant?.id === v.id ? 'border-black bg-black text-white' : 'border-neutral-200 hover:border-black'}`}
                    >
                      {v.value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Availability States */}
            {selectedVariant && (
              <div className="mb-8 p-4 rounded-xl border border-neutral-100 bg-neutral-50/50">
                {selectedVariant.stock > 0 ? (
                  <div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      <span>In Stock</span>
                    </span>
                    <p className="text-[10px] text-neutral-400 mt-1">Available for immediate processing and checkout.</p>
                  </div>
                ) : (
                  <div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                      <span>Out of Stock</span>
                    </span>
                    
                    {/* Relative ETA Text Display */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-neutral-600 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{getRestockEtaText(selectedVariant.restockEta, selectedVariant.restockNote)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions: Add to Cart / Wishlist */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleAddToCart}
                disabled={actionLoading || (selectedVariant ? selectedVariant.stock === 0 : true)}
                className="flex-1 border-brutal bg-black text-white px-8 py-4 font-bold uppercase tracking-wider text-xs shadow-brutal hover:bg-neutral-800 disabled:bg-neutral-200 disabled:border-neutral-200 disabled:shadow-none disabled:text-neutral-400 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShoppingBag className="w-4 h-4" />
                )}
                <span>Add to Cart</span>
              </button>
              <button 
                onClick={handleAddToWishlist}
                className="border border-neutral-200 hover:border-black rounded-lg p-4 transition-colors"
              >
                <Heart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
