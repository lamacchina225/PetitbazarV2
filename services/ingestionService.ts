import { SourcePlatform } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type ScrapedItem = {
  sourceProductId: string;
  sourceUrl: string;
  title?: string;
  description?: string;
  images?: string[];
  price?: number;
};

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

export async function runImportJob(platform: SourcePlatform, query: string) {
  const job = await prisma.importJob.create({
    data: {
      platform,
      query,
      status: 'RUNNING',
      startedAt: new Date(),
    },
  });

  try {
    const actorMap: Record<SourcePlatform, string> = {
      ALIEXPRESS: process.env.APIFY_ACTOR_ALIEXPRESS || '',
      SHEIN: process.env.APIFY_ACTOR_SHEIN || '',
      TAOBAO: process.env.APIFY_ACTOR_TAOBAO || '',
      TEMU: process.env.APIFY_ACTOR_TEMU || '',
      DHGATE: process.env.APIFY_ACTOR_DHGATE || '',
      OTHER: '',
    };

    const actor = actorMap[platform];
    const items = actor ? await runApifyActor(actor, { query, maxItems: 20 }) : [];

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
      data: { status: 'SUCCESS', finishedAt: new Date(), metadata: { itemCount: items.length } },
    });

    return { id: job.id, itemCount: items.length };
  } catch (error) {
    await prisma.importJob.update({
      where: { id: job.id },
      data: { status: 'FAILED', finishedAt: new Date(), error: error instanceof Error ? error.message : 'Unknown error' },
    });
    throw error;
  }
}

export async function normalizeRawToProducts(importJobId: string, categoryId: string) {
  const raws = await prisma.productRaw.findMany({ where: { importJobId, normalized: false } });

  let created = 0;
  for (const raw of raws) {
    const payload = raw.payload as unknown as { title?: string; description?: string; images?: string[]; price?: number };

    const name = payload.title || `Produit ${raw.sourceProductId}`;
    const salePrice = Number(payload.price || 0);
    const originalPrice = Math.max(salePrice, salePrice * 1.2);

    await prisma.product.upsert({
      where: {
        sourcePlatform_sourceProductId: {
          sourcePlatform: raw.platform,
          sourceProductId: raw.sourceProductId,
        },
      },
      update: {
        name,
        description: payload.description || null,
        salePrice,
        originalPrice,
        cost: salePrice * 0.5,
        images: Array.isArray(payload.images) ? payload.images : [],
        categoryId,
      },
      create: {
        name,
        slug: `${raw.platform.toLowerCase()}-${raw.sourceProductId}`,
        description: payload.description || null,
        originalPrice,
        salePrice,
        cost: salePrice * 0.5,
        discount: originalPrice > 0 ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0,
        images: Array.isArray(payload.images) ? payload.images : [],
        stock: 0,
        sku: `${raw.platform}-${raw.sourceProductId}`,
        sourcePlatform: raw.platform,
        sourceUrl: raw.sourceUrl,
        sourceProductId: raw.sourceProductId,
        categoryId,
        status: 'DRAFT',
      },
    });

    await prisma.productRaw.update({ where: { id: raw.id }, data: { normalized: true } });
    created += 1;
  }

  return { normalizedCount: created };
}
