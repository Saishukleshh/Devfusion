import { prisma } from '@/lib/prisma';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: {
      products: {
        where: {
          isActive: true,
          isPublished: true,
        },
        include: {
          store: { select: { name: true } },
          variants: { where: { isActive: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!category) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans relative">
      <div className="noise-overlay" />
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-10">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Category</p>
            <h1 className="font-display text-5xl md:text-6xl font-black uppercase tracking-tight mt-3">{category.name}</h1>
            <p className="max-w-2xl text-sm text-neutral-600 leading-relaxed mt-4">
              {category.description || `Browse listings for ${category.name}.`}
            </p>
          </div>
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 rounded-full border border-black px-5 py-3 text-xs font-bold uppercase tracking-widest hover:bg-neutral-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All Categories
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {category.products.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-neutral-200 bg-neutral-50 p-10 text-center text-neutral-500">
              No products found in this category yet.
            </div>
          ) : (
            category.products.map((product) => {
              const price = (product.price / 100).toLocaleString('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0,
              });
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group rounded-3xl border border-neutral-200 overflow-hidden bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="relative h-72 overflow-hidden bg-neutral-100">
                    <img
                      src={product.images[0] || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=600&auto=format&fit=crop'}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] uppercase tracking-widest text-neutral-400">{product.store?.name || 'VendorVerse'}</p>
                      <span className="text-xs font-bold uppercase tracking-widest text-amber-600">{price}</span>
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-black uppercase tracking-tight">{product.name}</h2>
                      <p className="text-sm text-neutral-500 mt-2 line-clamp-2">{product.description}</p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-neutral-400">
                      <span>{product.variants.length} variant{product.variants.length === 1 ? '' : 's'}</span>
                      <span>{product.totalReviews || 0} reviews</span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
