export interface ParsedItem {
  name: string;
  description: string;
  categorySlug: string;
  brand: string;
  price: number;
  discount: number;
  stock: number;
  tags: string[];
  images: string[];
}

export const PRODUCT_EXTRACTION_SYSTEM_PROMPT = `You are an intelligent catalog extraction assistant.
Parse the seller's import text into a clean JSON array of products.
Each product object must include these exact fields:
- name
- description
- categorySlug
- brand
- price
- discount
- stock
- tags
- images

Return only valid JSON. Do not prepend or append any markdown, explanation, or commentary.
If a field is missing, return an empty string for text fields, 0 for numeric fields, and an empty array for tags/images.`;

export const HEADER_MAPPING_SYSTEM_PROMPT = `Map spreadsheet and WhatsApp field labels to these standard keys:
- name, title, item name -> name
- description, desc, details, product description -> description
- category, categorySlug, category name, product category -> categorySlug
- brand, manufacturer -> brand
- price, cost, mrp -> price
- discount, discountPercent -> discount
- stock, quantity, qty -> stock
- tags, keywords -> tags
- images, image, photo, photos -> images

Allow fields in any order and normalize common variations.
Do not invent extra keys.`;

const canonicalHeaderMap: Record<string, string> = {
  name: 'name',
  title: 'name',
  'item name': 'name',
  description: 'description',
  desc: 'description',
  details: 'description',
  'product description': 'description',
  category: 'categorySlug',
  categoryslug: 'categorySlug',
  'category name': 'categorySlug',
  'product category': 'categorySlug',
  brand: 'brand',
  manufacturer: 'brand',
  price: 'price',
  cost: 'price',
  mrp: 'price',
  discount: 'discount',
  discountpercent: 'discount',
  stock: 'stock',
  quantity: 'stock',
  qty: 'stock',
  tags: 'tags',
  keywords: 'tags',
  images: 'images',
  image: 'images',
  photo: 'images',
  photos: 'images',
};

function normalizeKey(rawKey: string) {
  return rawKey
    .trim()
    .toLowerCase()
    .replace(/[:=]+$/, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeArrayInput(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => item?.toString().trim()).filter(Boolean);
  }
  return value
    .toString()
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
}

function normalizeParsedItem(raw: any): ParsedItem | null {
  if (!raw || typeof raw !== 'object') return null;

  const tags = normalizeArrayInput(raw.tags || raw.keywords || raw.keyword || raw.categories);
  const images = normalizeArrayInput(raw.images || raw.image || raw.photo || raw.photos);

  const name = raw.name || raw.title || raw.productName || raw.item || raw['Item Name'] || '';
  if (!name || typeof name !== 'string') return null;

  const categorySlug = slugify(
    raw.category || raw.categorySlug || raw.category_name || raw['category name'] || raw['product category'] || ''
  );

  return {
    name: name.toString().trim(),
    description: raw.description || raw.desc || raw.details || '',
    categorySlug: categorySlug || 'supplies',
    brand: raw.brand || raw.manufacturer || '',
    price: Math.max(0, parseFloat(raw.price ?? raw.cost ?? raw.mrp ?? '0') || 0),
    discount: Math.max(0, Math.min(100, parseInt(raw.discount ?? raw.discountPercent ?? '0', 10) || 0)),
    stock: Math.max(0, parseInt(raw.stock ?? raw.quantity ?? raw.qty ?? '0', 10) || 0),
    tags,
    images,
  };
}

function mapHeaderName(header: string) {
  const normalized = normalizeKey(header);
  return canonicalHeaderMap[normalized] ?? normalized;
}

export function parseCsvLike(rawText: string): ParsedItem[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];
  const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
  const headerKeys = lines[0].split(delimiter).map((header) => mapHeaderName(header));

  if (!headerKeys.some((key) => ['name', 'title', 'category', 'categorySlug'].includes(key))) {
    return [];
  }

  return lines.slice(1).map((line) => {
    const values = line.split(delimiter).map((value) => value.trim());
    const row: Record<string, string> = {};
    headerKeys.forEach((key, index) => {
      row[key] = values[index] ?? '';
    });
    return normalizeParsedItem(row);
  }).filter(Boolean) as ParsedItem[];
}

export function parseKeyValueBlocks(rawText: string): ParsedItem[] {
  const blocks = rawText.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  const items: ParsedItem[] = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const data: Record<string, string> = {};
    let hasField = false;

    for (const line of lines) {
      const separatorMatch = line.match(/(.*?)([:=])\s*(.*)/);
      if (!separatorMatch) continue;
      const [, rawKey, , rawValue] = separatorMatch;
      const key = mapHeaderName(rawKey);
      data[key] = rawValue.trim();
      hasField = true;
    }

    if (!hasField) continue;
    const normalized = normalizeParsedItem(data);
    if (normalized) items.push(normalized);
  }

  return items;
}

export function parseRawTextLocally(rawText: string): ParsedItem[] {
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  const jsonCandidate = (() => {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeParsedItem).filter(Boolean) as ParsedItem[];
      }
      if (typeof parsed === 'object' && parsed !== null) {
        const item = normalizeParsedItem(parsed);
        return item ? [item] : [];
      }
    } catch {
      return null;
    }
    return null;
  })();

  if (jsonCandidate && jsonCandidate.length > 0) return jsonCandidate;

  const csvItems = parseCsvLike(trimmed);
  if (csvItems.length > 0) return csvItems;

  const kvItems = parseKeyValueBlocks(trimmed);
  if (kvItems.length > 0) return kvItems;

  return [];
}

async function tryParseJsonFromText(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/(\[\s*\{[\s\S]*\}\s*\])/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function runGeminiCatalogExtraction(rawText: string): Promise<ParsedItem[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const apiBase = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1/chat/completions';
  try {
    const response = await fetch(apiBase, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: `${PRODUCT_EXTRACTION_SYSTEM_PROMPT}\n\n${HEADER_MAPPING_SYSTEM_PROMPT}` },
          { role: 'user', content: rawText },
        ],
        temperature: 0.2,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content ?? result?.choices?.[0]?.text;
    if (!content || typeof content !== 'string') return null;

    const parsed = await tryParseJsonFromText(content);
    if (!parsed || !Array.isArray(parsed)) return null;

    return parsed.map(normalizeParsedItem).filter(Boolean) as ParsedItem[];
  } catch (error) {
    console.error('Gemini extraction failed:', error);
    return null;
  }
}

export async function parseImporterInput(rawText: string): Promise<ParsedItem[]> {
  const localItems = parseRawTextLocally(rawText);
  if (localItems.length > 0) return localItems;

  const aiItems = await runGeminiCatalogExtraction(rawText);
  return aiItems || [];
}
