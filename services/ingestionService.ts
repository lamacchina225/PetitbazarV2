import { SourcePlatform } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type ScrapedItem = {
  sourceProductId: string;
  sourceUrl: string;
  title?: string;
  description?: string;
  images?: string[];
  price?: number;
  sizes?: string[];
  variants?: unknown;
};

const IMPORTABLE_PLATFORMS: SourcePlatform[] = [
  SourcePlatform.ALIEXPRESS,
  SourcePlatform.SHEIN,
  SourcePlatform.TAOBAO,
  SourcePlatform.TEMU,
  SourcePlatform.DHGATE,
];

const DEFAULT_IMAGES: Record<SourcePlatform, string[]> = {
  ALIEXPRESS: [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200',
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200',
  ],
  SHEIN: [
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200',
  ],
  TAOBAO: [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200',
    'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?w=1200',
  ],
  TEMU: [
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200',
    'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=1200',
  ],
  DHGATE: [
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1200',
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200',
  ],
  OTHER: [
    'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200',
    'https://images.unsplash.com/photo-1521334884684-d80222895322?w=1200',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200',
  ],
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function safePositiveNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function safeString(value: unknown): string {
  return String(value ?? '').trim();
}

function hashString(seed: string): number {
  return seed.split('').reduce((acc, ch) => (acc * 33 + ch.charCodeAt(0)) >>> 0, 5381);
}

function getFallbackImage(platform: SourcePlatform, seed: string): string {
  const pool = DEFAULT_IMAGES[platform] || DEFAULT_IMAGES.OTHER;
  return pool[hashString(seed) % pool.length];
}

export function detectPlatformFromUrl(url: string): SourcePlatform {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes('aliexpress')) return SourcePlatform.ALIEXPRESS;
  if (host.includes('shein')) return SourcePlatform.SHEIN;
  if (host.includes('taobao')) return SourcePlatform.TAOBAO;
  if (host.includes('temu')) return SourcePlatform.TEMU;
  if (host.includes('dhgate')) return SourcePlatform.DHGATE;
  return SourcePlatform.OTHER;
}

function extractImages(payload: Record<string, unknown>, platform: SourcePlatform, seed: string): string[] {
  const candidates: unknown[] = [];

  if (Array.isArray(payload.images)) candidates.push(...payload.images);
  if (Array.isArray(payload.imageUrls)) candidates.push(...payload.imageUrls);
  if (Array.isArray(payload.gallery)) candidates.push(...payload.gallery);
  if (Array.isArray(payload.photos)) candidates.push(...payload.photos);
  if (payload.image) candidates.push(payload.image);
  if (payload.imageUrl) candidates.push(payload.imageUrl);
  if (payload.thumbnail) candidates.push(payload.thumbnail);
  if (payload.thumbnailUrl) candidates.push(payload.thumbnailUrl);

  const images = candidates
    .map((img) => String(img || '').trim())
    .filter((img) => /^https?:\/\//i.test(img));

  if (images.length > 0) return Array.from(new Set(images)).slice(0, 10);
  return [getFallbackImage(platform, seed)];
}

function extractStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => safeString(item)).filter(Boolean);
  return [safeString(value)].filter(Boolean);
}

function normalizeSize(value: string): string {
  return value.toUpperCase().replace(/\s+/g, '').trim();
}

function extractSizes(payload: Record<string, unknown>): string[] {
  const candidates: string[] = [];
  const keys = ['sizes', 'size', 'availableSizes', 'sizeOptions', 'options', 'attributes', 'variants'];
  for (const key of keys) {
    const v = payload[key];
    if (!v) continue;
    if (typeof v === 'string') candidates.push(v);
    if (Array.isArray(v)) candidates.push(...v.map((x) => safeString(typeof x === 'object' ? (x as Record<string, unknown>).name ?? x : x)));
    if (typeof v === 'object' && !Array.isArray(v)) {
      const obj = v as Record<string, unknown>;
      candidates.push(...extractStringArray(obj.size));
      candidates.push(...extractStringArray(obj.sizes));
      candidates.push(...extractStringArray(obj.value));
      candidates.push(...extractStringArray(obj.values));
      if (Array.isArray(obj.options)) candidates.push(...obj.options.map((o) => safeString((o as Record<string, unknown>).name ?? o)));
    }
  }
  return Array.from(new Set(candidates.map(normalizeSize).filter(Boolean))).slice(0, 30);
}

function tryParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function findJsonLdProducts(html: string): Record<string, unknown>[] {
  const scripts = Array.from(html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
  const products: Record<string, unknown>[] = [];

  const walk = (value: unknown) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (typeof value !== 'object') return;
    const obj = value as Record<string, unknown>;
    const t = safeString(obj['@type']).toLowerCase();
    if (t === 'product' || t.includes('product')) {
      products.push(obj);
      return;
    }
    if (obj['@graph']) walk(obj['@graph']);
    if (obj.mainEntity) walk(obj.mainEntity);
    if (obj.itemListElement) walk(obj.itemListElement);
  };

  for (const script of scripts) {
    const parsed = tryParseJson(script[1].trim());
    walk(parsed);
  }
  return products;
}

function extractMetaContent(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const rx = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i');
    const match = html.match(rx);
    if (match?.[1]) return match[1];
  }
  return null;
}

function extractImageUrlsFromHtml(html: string): string[] {
  const matches = Array.from(
    html.matchAll(/https?:\/\/[^"'\\\s>]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'<\s]*)?/gi)
  );
  const urls = matches
    .map((m) => String(m[0] || '').trim())
    .filter((url) => /^https?:\/\//i.test(url))
    .filter((url) => !url.includes('/logo') && !url.includes('/icon') && !url.includes('/sprite'));
  return Array.from(new Set(urls)).slice(0, 20);
}

async function scrapeSourceProduct(url: string, fallbackPlatform: SourcePlatform): Promise<ScrapedItem | null> {
  const res = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36',
      accept: 'text/html,application/xhtml+xml',
    },
  });
  if (!res.ok) return null;
  const html = await res.text();
  const platform = fallbackPlatform === SourcePlatform.OTHER ? detectPlatformFromUrl(url) : fallbackPlatform;

  const products = findJsonLdProducts(html);
  const p = products[0] || {};
  const image = (p.image || p.images || extractMetaContent(html, ['og:image', 'twitter:image'])) as unknown;
  const title = safeString(p.name || extractMetaContent(html, ['og:title']) || 'Produit source');
  const description = safeString(
    p.description || extractMetaContent(html, ['og:description', 'description']) || title
  );

  const offers = (p.offers || {}) as Record<string, unknown>;
  const price = safePositiveNumber(
    offers.price || (Array.isArray(offers) ? (offers[0] as Record<string, unknown>)?.price : undefined),
    0
  );

  const sourceProductId = safeString(
    p.sku || p.productID || p.mpn || new URL(url).pathname.split('/').filter(Boolean).pop() || slugify(title)
  );

  const payload: Record<string, unknown> = {
    ...p,
    title,
    description,
    images: [
      ...(Array.isArray(image) ? image : image ? [image] : []),
      ...extractImageUrlsFromHtml(html),
    ],
    price,
  };

  const images = extractImages(payload, platform, `${platform}-${sourceProductId}`);
  const sizes = extractSizes(payload);

  // Generic variants from JSON-LD offers/options if present
  const variantsRaw =
    (Array.isArray(offers) ? offers : offers?.offers) ||
    (p.isVariantOf as unknown) ||
    null;

  return {
    sourceProductId,
    sourceUrl: url,
    title,
    description,
    images: images.slice(0, 10),
    price,
    sizes,
    variants: variantsRaw,
  };
}

function priceFromSeed(seed: string): number {
  const hash = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return 2500 + (hash % 40) * 500;
}

function inferCategoryHint(input: string): string {
  const text = input.toLowerCase();
  if (
    text.includes('robe') ||
    text.includes('shirt') ||
    text.includes('t-shirt') ||
    text.includes('mode') ||
    text.includes('fashion') ||
    text.includes('sac') ||
    text.includes('chauss')
  ) {
    return 'Mode';
  }
  if (
    text.includes('phone') ||
    text.includes('bluetooth') ||
    text.includes('camera') ||
    text.includes('smart') ||
    text.includes('electron')
  ) {
    return 'Electronique';
  }
  if (
    text.includes('beaut') ||
    text.includes('makeup') ||
    text.includes('cosmet') ||
    text.includes('soin')
  ) {
    return 'Beaute';
  }
  return 'Accessoires';
}

async function ensureCategoryByName(name: string) {
  const slug = slugify(name) || 'accessoires';
  return prisma.category.upsert({
    where: { slug },
    update: { name },
    create: { name, slug, featured: true },
  });
}

function normalizeRawItem(platform: SourcePlatform, item: Record<string, unknown>, idx: number, query: string): ScrapedItem {
  const sourceProductId =
    String(
      item.sourceProductId ||
      item.productId ||
      item.id ||
      item.sku ||
      `${platform}-${slugify(query || 'article')}-${idx + 1}`
    ).trim();

  const sourceUrl = String(
    item.sourceUrl ||
    item.url ||
    item.productUrl ||
    `https://example.com/${platform.toLowerCase()}/${sourceProductId}`
  ).trim();

  const title = String(item.title || item.name || item.productTitle || `Produit ${sourceProductId}`).trim();
  const description = String(item.description || item.summary || `${title} - import ${platform}`).trim();

  const images = extractImages(item, platform, `${platform}-${sourceProductId}`);
  const sizes = extractSizes(item);

  const price = safePositiveNumber(item.price ?? item.salePrice ?? item.currentPrice, 0);

  return {
    sourceProductId,
    sourceUrl,
    title,
    description,
    images,
    price,
    sizes,
    variants: item.variants ?? item.options ?? item.attributes ?? null,
  };
}

async function runApifyActor(actorId: string, input: Record<string, unknown>) {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error('APIFY_TOKEN manquant');
  }

  const runRes = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!runRes.ok) {
    throw new Error(`Echec lancement actor ${actorId}`);
  }

  const runJson = await runRes.json();
  const datasetId = runJson?.data?.defaultDatasetId;
  if (!datasetId) return [];

  const itemsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?clean=true&token=${token}`);
  if (!itemsRes.ok) return [];
  return (await itemsRes.json()) as ScrapedItem[];
}

async function runCustomFeed(platform: SourcePlatform, query: string, maxItems: number) {
  const key = `SUPPLIER_FEED_${platform}`;
  const endpoint = process.env[key];
  if (!endpoint) return [] as ScrapedItem[];

  const url = new URL(endpoint);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', String(maxItems));
  url.searchParams.set('platform', platform);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Echec feed ${platform} (${res.status})`);

  const json = await res.json();
  const rows = Array.isArray(json)
    ? json
    : Array.isArray((json as { items?: unknown[] }).items)
      ? (json as { items: unknown[] }).items
      : [];

  return rows
    .slice(0, maxItems)
    .map((row, idx) => normalizeRawItem(platform, (row || {}) as Record<string, unknown>, idx, query));
}

function buildFallbackItems(platform: SourcePlatform, query: string, maxItems: number): ScrapedItem[] {
  const safeQuery = query.trim() || 'tendance';
  return Array.from({ length: Math.max(1, Math.min(maxItems, 30)) }).map((_, index) => {
    const sourceProductId = `${slugify(safeQuery)}-${index + 1}`;
    const title = `${safeQuery} ${platform} ${index + 1}`;
    const price = priceFromSeed(`${platform}-${safeQuery}-${index + 1}`);
    return {
      sourceProductId,
      sourceUrl: `https://example.com/${platform.toLowerCase()}/${sourceProductId}`,
      title,
      description: `${title} importe automatiquement depuis ${platform}.`,
      images: [getFallbackImage(platform, `${platform}-${sourceProductId}`)],
      price,
      sizes: ['S', 'M', 'L'],
      variants: null,
    };
  });
}

async function collectPlatformItems(platform: SourcePlatform, query: string, maxItems: number) {
  const actorMap: Record<SourcePlatform, string> = {
    ALIEXPRESS: process.env.APIFY_ACTOR_ALIEXPRESS || '',
    SHEIN: process.env.APIFY_ACTOR_SHEIN || '',
    TAOBAO: process.env.APIFY_ACTOR_TAOBAO || '',
    TEMU: process.env.APIFY_ACTOR_TEMU || '',
    DHGATE: process.env.APIFY_ACTOR_DHGATE || '',
    OTHER: '',
  };

  const actor = actorMap[platform];
  if (actor && process.env.APIFY_TOKEN) {
    const items = await runApifyActor(actor, { query, maxItems });
    return {
      source: 'apify',
      items: items.slice(0, maxItems).map((it, idx) =>
        normalizeRawItem(platform, it as unknown as Record<string, unknown>, idx, query)),
    };
  }

  try {
    const customFeedItems = await runCustomFeed(platform, query, maxItems);
    if (customFeedItems.length > 0) {
      return { source: 'custom_feed', items: customFeedItems };
    }
  } catch {
    // Fallback below
  }

  return { source: 'fallback', items: buildFallbackItems(platform, query, maxItems) };
}

export async function runImportJob(
  platform: SourcePlatform,
  query: string,
  maxItems = 20,
  options?: { sourceUrls?: string[]; realOnly?: boolean }
) {
  if (!IMPORTABLE_PLATFORMS.includes(platform)) {
    throw new Error('Plateforme non supportee pour import');
  }

  const job = await prisma.importJob.create({
    data: {
      platform,
      query,
      status: 'RUNNING',
      startedAt: new Date(),
    },
  });

  try {
    let source = 'fallback';
    let items: ScrapedItem[] = [];

    const sourceUrls = (options?.sourceUrls || []).map((u) => safeString(u)).filter(Boolean);
    if (sourceUrls.length > 0) {
      const scraped = await Promise.all(
        sourceUrls.slice(0, maxItems).map((u) => scrapeSourceProduct(u, platform))
      );
      items = scraped.filter((x): x is ScrapedItem => Boolean(x));
      source = 'url_scrape';
    } else {
      const collected = await collectPlatformItems(platform, query, maxItems);
      items = collected.items;
      source = collected.source;
    }

    if (options?.realOnly && source === 'fallback') {
      throw new Error(
        `Impossible d'obtenir des donnees reelles pour ${platform}. Configure APIFY_ACTOR_${platform} + APIFY_TOKEN ou passe des URLs source.`
      );
    }

    if (items.length === 0) {
      throw new Error(
        `Aucun article recupere pour ${platform}. Verifie les URLs source, la requete, ou la disponibilite du fournisseur.`
      );
    }

    if (items.length > 0) {
      await prisma.productRaw.createMany({
        data: items.map((it) => ({
          importJobId: job.id,
          platform,
          sourceProductId: it.sourceProductId,
          sourceUrl: it.sourceUrl,
          payload: it as never,
        })),
        skipDuplicates: true,
      });
    }

    await prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: 'SUCCESS',
        finishedAt: new Date(),
        metadata: { itemCount: items.length, source, maxItems },
      },
    });

    return { id: job.id, itemCount: items.length, source };
  } catch (error) {
    await prisma.importJob.update({
      where: { id: job.id },
      data: { status: 'FAILED', finishedAt: new Date(), error: error instanceof Error ? error.message : 'Unknown error' },
    });
    throw error;
  }
}

export async function normalizeRawToProducts(importJobId: string, categoryId?: string) {
  const [raws, job] = await Promise.all([
    prisma.productRaw.findMany({ where: { importJobId, normalized: false } }),
    prisma.importJob.findUnique({ where: { id: importJobId }, select: { query: true } }),
  ]);

  let providedCategoryId: string | undefined = undefined;
  if (categoryId) {
    const foundCategory = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
    if (!foundCategory) throw new Error('Categorie fournie introuvable');
    providedCategoryId = foundCategory.id;
  }

  const categoryCache = new Map<string, string>();
  const usedNames = new Map<string, number>();
  let createdCount = 0;
  let updatedCount = 0;
  let created = 0;

  for (const raw of raws) {
    const payload = raw.payload as unknown as Record<string, unknown>;

    const baseName = String(payload.title || payload.name || `Produit ${raw.sourceProductId}`).trim();
    const description = payload.description ? String(payload.description).trim() : null;
    const nameKey = baseName.toLowerCase();
    const alreadyUsed = usedNames.get(nameKey) || 0;
    usedNames.set(nameKey, alreadyUsed + 1);
    const suffix = alreadyUsed > 0 ? ` ${raw.platform} ${String(raw.sourceProductId).slice(-4)}` : '';
    const name = `${baseName}${suffix}`.trim();
    const seedPrice = priceFromSeed(`${raw.platform}-${raw.sourceProductId}`);
    const salePrice = safePositiveNumber(payload.price, seedPrice);
    const originalPrice = Math.max(salePrice, Math.round(salePrice * 1.25));
    const cost = Math.round(salePrice * 0.55);
    const images = extractImages(payload, raw.platform, `${raw.platform}-${raw.sourceProductId}`);
    const sizes = extractSizes(payload);
    const variants = payload.variants ?? payload.options ?? payload.attributes ?? null;
    const categoryHint = inferCategoryHint(
      [job?.query || '', String(payload.title || payload.name || ''), String(payload.description || '')].join(' ')
    );

    const resolvedCategoryId = providedCategoryId
      || categoryCache.get(categoryHint)
      || (await ensureCategoryByName(categoryHint)).id;
    categoryCache.set(categoryHint, resolvedCategoryId);

    const existing = await prisma.product.findUnique({
      where: {
        sourcePlatform_sourceProductId: {
          sourcePlatform: raw.platform,
          sourceProductId: raw.sourceProductId,
        },
      },
      select: { id: true },
    });

    const product = await prisma.product.upsert({
      where: {
        sourcePlatform_sourceProductId: {
          sourcePlatform: raw.platform,
          sourceProductId: raw.sourceProductId,
        },
      },
      update: {
        name,
        description,
        salePrice,
        originalPrice,
        cost,
        discount: originalPrice > 0 ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0,
        images,
        sizes,
        variants: variants as never,
        sourceUrl: raw.sourceUrl || String(payload.sourceUrl || payload.url || `https://example.com/${raw.platform.toLowerCase()}/${raw.sourceProductId}`),
        categoryId: resolvedCategoryId,
        status: 'ACTIVE',
      },
      create: {
        name,
        slug: slugify(`${raw.platform.toLowerCase()}-${raw.sourceProductId}`),
        description,
        originalPrice,
        salePrice,
        cost,
        discount: originalPrice > 0 ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0,
        images,
        sizes,
        variants: variants as never,
        stock: 10,
        sku: `${raw.platform}-${raw.sourceProductId}`.toUpperCase(),
        sourcePlatform: raw.platform,
        sourceUrl: raw.sourceUrl || String(payload.sourceUrl || payload.url || `https://example.com/${raw.platform.toLowerCase()}/${raw.sourceProductId}`),
        sourceProductId: raw.sourceProductId,
        categoryId: resolvedCategoryId,
        status: 'ACTIVE',
      },
    });

    await prisma.productRaw.update({
      where: { id: raw.id },
      data: { normalized: true, productId: product.id },
    });
    if (existing) updatedCount += 1;
    else createdCount += 1;
    created += 1;
  }

  return { normalizedCount: created, createdCount, updatedCount };
}
