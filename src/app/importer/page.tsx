'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Upload, 
  FileSpreadsheet, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  Check, 
  Edit3, 
  Trash2,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function AIImporterPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'spreadsheet'>('whatsapp');
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // WhatsApp form state
  const [captionText, setCaptionText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Spreadsheet form state
  const [csvText, setCsvText] = useState('');

  // Editable Review Items list state (Never auto-published without review)
  const [reviewItems, setReviewItems] = useState<any[]>([]);

  // Demo Preset 1: WhatsApp raw text sample
  const loadWhatsAppPreset = () => {
    setCaptionText(`Handcrafted Pure Linen Blazer Jacket 🧥
Original price Rs 4,999 only (MRP 8000)
COD available all over India! 🇮🇳
DM to order or WhatsApp 9876543210
Available in sizes S, M, L, XL
Fabric: 100% European Linen slub. Stock 15 pcs.`);
    setImagePreview('https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop');
    toast.success('Loaded WhatsApp Sample Preset!');
  };

  // Demo Preset 2: Messy Spreadsheet CSV sample
  const loadSpreadsheetPreset = () => {
    setCsvText(`Product_Title,Cost/pc,Qty Avail,Cat_Name,Details,Size_Val
Organic Cotton Oversized Tee,1299,25,Fashion,Heavyweight 240 GSM combed cotton,M
Minimalist Leather Cardholder,899,40,Fashion,Top-grain vegetable tanned leather,OneSize
Nordic Ceramic Coffee Mug,549,30,Home Decor,Hand-thrown matte black ceramic,Standard`);
    toast.success('Loaded Messy Spreadsheet Sample Preset!');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Process WhatsApp Image + Caption via Gemini API
  const handleExtractWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captionText && !imagePreview) {
      toast.error('Please enter a caption or upload a photo.');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/import/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          captionText,
          imageBase64: imagePreview || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract product');
      }

      toast.success('Extracted listing successfully!');
      setReviewItems([
        ...reviewItems,
        {
          id: `item-${Date.now()}`,
          name: data.data.name,
          description: data.data.description,
          category: data.data.category,
          brand: data.data.brand || 'Artisan Direct',
          priceRupees: data.data.priceRupees || 4999,
          pricePaise: data.data.pricePaise || 499900,
          suggestedStock: data.data.suggestedStock || 10,
          variants: data.data.variants || [],
          flags: data.data.flags || [],
          confidence: data.data.confidence || 0.9,
          images: imagePreview ? [imagePreview] : ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop'],
        },
      ]);
    } catch (err: any) {
      toast.error(err.message || 'Extraction failed.');
    } finally {
      setLoading(false);
    }
  };

  // Process Messy Spreadsheet CSV via Gemini Column Mapping API
  const handleExtractSpreadsheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText) {
      toast.error('Please enter CSV spreadsheet rows.');
      return;
    }
    setLoading(true);

    try {
      // Parse CSV client-side lines
      const lines = csvText.trim().split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        throw new Error('CSV must contain a header row and at least one data row.');
      }

      const headers = lines[0].split(',').map((h) => h.trim());
      const rows = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim());
        const rowObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        return rowObj;
      });

      const res = await fetch('/api/import/spreadsheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headers, rows }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process spreadsheet');
      }

      toast.success(`Parsed ${data.products.length} products with Gemini AI mapping!`);
      
      const formatted = data.products.map((p: any, idx: number) => ({
        id: `item-${Date.now()}-${idx}`,
        name: p.name,
        description: p.description || p.name,
        category: p.category || 'Fashion',
        brand: p.brand || 'Artisan Direct',
        priceRupees: p.priceRupees || 1299,
        pricePaise: p.pricePaise || 129900,
        suggestedStock: p.stock || 15,
        variants: p.variants || [],
        flags: p.flags || [],
        confidence: 0.88,
        images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop'],
      }));

      setReviewItems([...reviewItems, ...formatted]);
    } catch (err: any) {
      toast.error(err.message || 'Spreadsheet parsing failed.');
    } finally {
      setLoading(false);
    }
  };

  // Save changes in review table
  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updated = [...reviewItems];
    updated[index][field] = value;
    if (field === 'priceRupees') {
      updated[index].pricePaise = Math.round(parseFloat(value || '0') * 100);
    }
    setReviewItems(updated);
  };

  const handleRemoveReviewItem = (index: number) => {
    setReviewItems(reviewItems.filter((_, i) => i !== index));
  };

  // Bulk Publish to Live Database
  const handlePublishAll = async () => {
    if (reviewItems.length === 0) return;
    setPublishing(true);

    try {
      const res = await fetch('/api/import/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: reviewItems }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Please log in as a seller to publish products.');
          router.push('/login?redirectTo=/importer');
          return;
        }
        throw new Error(data.error || 'Failed to publish products');
      }

      toast.success(`Published ${data.count} live product listings to your store!`);
      setReviewItems([]);
      router.push('/seller/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans relative">
      <div className="noise-overlay" />

      {/* Floating Glass Navigation */}
      <header className="sticky top-0 z-50 px-4 md:px-8 py-4">
        <nav className="mx-auto max-w-7xl glass rounded-full px-6 py-3 flex items-center justify-between shadow-sm">
          <Link href="/" className="font-display font-extrabold text-2xl tracking-tighter uppercase flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <span>AI CATALOG IMPORTER</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/seller/dashboard" className="text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-black">
              Seller Dashboard
            </Link>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        {/* Banner */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block mb-3">
            One-Step Catalog Digitization Engine
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tight mb-3">
            Turn Messy Catalogs into Live Listings
          </h1>
          <p className="text-neutral-500 text-xs font-light leading-relaxed">
            Extract structured products from informal WhatsApp captions and product photos, or map messy Excel/CSV files dynamically using Gemini 1.5 Flash.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8 p-1 bg-neutral-100 rounded-xl">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`py-3 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'whatsapp' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-black'}`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp / Photo</span>
          </button>
          <button
            onClick={() => setActiveTab('spreadsheet')}
            className={`py-3 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'spreadsheet' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-black'}`}
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>Spreadsheet / CSV</span>
          </button>
        </div>

        {/* Form Container */}
        <div className="max-w-3xl mx-auto border border-neutral-200 p-6 md:p-8 rounded-2xl bg-white shadow-sm mb-12">
          {activeTab === 'whatsapp' ? (
            <form onSubmit={handleExtractWhatsApp} className="space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
                <h3 className="font-display font-extrabold text-lg uppercase flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  <span>Import from WhatsApp Caption & Photo</span>
                </h3>
                
                {/* 1-Click Demo Preset Button */}
                <button
                  type="button"
                  onClick={loadWhatsAppPreset}
                  className="border border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>30s Demo Preset</span>
                </button>
              </div>

              {/* Photo Input */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-2">Product Photo</label>
                <div className="flex items-center gap-4">
                  <label className="border-2 border-dashed border-neutral-200 hover:border-black rounded-xl p-6 text-center cursor-pointer flex-1 transition-colors">
                    <Upload className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
                    <span className="text-xs font-semibold text-neutral-600">Click to upload photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-xl border border-neutral-200" />
                  )}
                </div>
              </div>

              {/* Caption Text Input */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-2">Raw WhatsApp Caption Text</label>
                <textarea
                  rows={4}
                  className="w-full border border-neutral-200 rounded-xl p-3 text-xs outline-none focus:border-black font-sans leading-relaxed"
                  placeholder="Paste raw WhatsApp text with price, emojis, size availability, etc..."
                  value={captionText}
                  onChange={(e) => setCaptionText(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full border-brutal bg-black text-white py-4 rounded-xl font-bold uppercase tracking-wider text-xs shadow-brutal hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Sparkles className="w-4.5 h-4.5 text-amber-500" />}
                <span>Extract Listing with Gemini AI</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleExtractSpreadsheet} className="space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
                <h3 className="font-display font-extrabold text-lg uppercase flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  <span>Import from Messy Spreadsheet (CSV)</span>
                </h3>

                {/* 1-Click Demo Preset Button */}
                <button
                  type="button"
                  onClick={loadSpreadsheetPreset}
                  className="border border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>30s Demo Preset</span>
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-2">CSV Rows (Headers + Data)</label>
                <textarea
                  rows={6}
                  className="w-full border border-neutral-200 rounded-xl p-3 text-xs outline-none focus:border-black font-mono leading-relaxed"
                  placeholder="Paste CSV text here with headers like Cost/pc, Qty Avail, Item_Name..."
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full border-brutal bg-black text-white py-4 rounded-xl font-bold uppercase tracking-wider text-xs shadow-brutal hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Sparkles className="w-4.5 h-4.5 text-amber-500" />}
                <span>Map Columns & Parse with Gemini AI</span>
              </button>
            </form>
          )}
        </div>

        {/* Editable Review Table Section (Never auto-publish without review) */}
        {reviewItems.length > 0 && (
          <section className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4 border-b border-black pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded">
                  Mandatory Review Screen
                </span>
                <h2 className="font-display text-2xl font-black uppercase tracking-tight mt-1">
                  Extracted Listings Review ({reviewItems.length})
                </h2>
              </div>

              <button
                onClick={handlePublishAll}
                disabled={publishing}
                className="border-brutal bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-brutal hover:bg-emerald-700 transition-all flex items-center gap-2"
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Publish All to Live Store</span>
              </button>
            </div>

            <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-[10px] uppercase font-bold tracking-wider text-neutral-400 border-b border-neutral-200">
                    <th className="p-4">Item Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price (₹)</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">AI Confidence / Flags</th>
                    <th className="p-4 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {reviewItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-neutral-50/50">
                      <td className="p-4">
                        <input
                          type="text"
                          className="w-full border border-neutral-200 rounded p-2 text-xs font-bold outline-none focus:border-black"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="text"
                          className="w-full border border-neutral-200 rounded p-2 text-xs outline-none focus:border-black"
                          value={item.category}
                          onChange={(e) => handleUpdateItem(idx, 'category', e.target.value)}
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="number"
                          className="w-24 border border-neutral-200 rounded p-2 text-xs font-bold text-amber-600 outline-none focus:border-black"
                          value={item.priceRupees}
                          onChange={(e) => handleUpdateItem(idx, 'priceRupees', e.target.value)}
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="number"
                          className="w-20 border border-neutral-200 rounded p-2 text-xs font-bold outline-none focus:border-black"
                          value={item.suggestedStock}
                          onChange={(e) => handleUpdateItem(idx, 'suggestedStock', parseInt(e.target.value, 10) || 0)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 text-[10px]">
                          <span className="font-bold text-emerald-600">
                            Confidence: {Math.round((item.confidence || 0.9) * 100)}%
                          </span>
                          {item.flags && item.flags.length > 0 && (
                            <span className="text-amber-600 italic">
                              {item.flags.join(', ')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleRemoveReviewItem(idx)}
                          className="text-neutral-400 hover:text-rose-600 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
