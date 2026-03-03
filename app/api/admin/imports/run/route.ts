import { NextRequest } from 'next/server';
import { SourcePlatform, UserRole } from '@prisma/client';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';
import { runImportJob, normalizeRawToProducts } from '@/services/ingestionService';

const PLATFORMS: SourcePlatform[] = [
  SourcePlatform.ALIEXPRESS,
  SourcePlatform.SHEIN,
  SourcePlatform.TAOBAO,
  SourcePlatform.TEMU,
  SourcePlatform.DHGATE,
];

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.ADMIN) return fail('Interdit', 403);

    const { platform, query, categoryId, maxItems, autoNormalize, sourceUrls, realOnly } = await request.json();
    if (!platform) return fail('platform requis', 400);

    const max = Math.min(Math.max(Number(maxItems || 20), 1), 100);
    const doNormalize = autoNormalize !== false;
    const urls =
      Array.isArray(sourceUrls)
        ? sourceUrls.map((u) => String(u || '').trim()).filter(Boolean)
        : [];
    if (urls.length === 0 && !String(query || '').trim()) {
      return fail('query ou sourceUrls requis', 400);
    }
    const selectedPlatforms =
      platform === 'ALL'
        ? PLATFORMS
        : PLATFORMS.includes(platform as SourcePlatform)
          ? [platform as SourcePlatform]
          : [];
    if (selectedPlatforms.length === 0) return fail('Plateforme invalide', 400);

    const tasks = selectedPlatforms
      .map((p) => {
        const platformUrls = urls.filter((u) => {
          const host = (() => {
            try {
              return new URL(u).hostname.toLowerCase();
            } catch {
              return '';
            }
          })();
          if (!host) return false;
          if (p === SourcePlatform.ALIEXPRESS) return host.includes('aliexpress');
          if (p === SourcePlatform.SHEIN) return host.includes('shein');
          if (p === SourcePlatform.TAOBAO) return host.includes('taobao');
          if (p === SourcePlatform.TEMU) return host.includes('temu');
          if (p === SourcePlatform.DHGATE) return host.includes('dhgate');
          return false;
        });
        // If no query was provided, only run platforms that actually have matching URLs.
        if (!String(query || '').trim() && platformUrls.length === 0) return null;
        return { platform: p, platformUrls };
      })
      .filter((task): task is { platform: SourcePlatform; platformUrls: string[] } => Boolean(task));

    if (tasks.length === 0) {
      return fail('Aucune URL valide pour la plateforme selectionnee', 400);
    }

    const runs = await Promise.all(
      tasks.map(async ({ platform: p, platformUrls }) => {
        const run = await runImportJob(p, String(query || ''), max, {
          sourceUrls: platformUrls,
          realOnly: realOnly !== false,
        });
        if (!doNormalize) return { platform: p, ...run };
        const normalized = await normalizeRawToProducts(run.id, categoryId ? String(categoryId) : undefined);
        return { platform: p, ...run, ...normalized };
      })
    );

    const summary = runs.reduce(
      (acc, r) => {
        acc.itemCount += Number(r.itemCount || 0);
        acc.normalizedCount += Number((r as { normalizedCount?: number }).normalizedCount || 0);
        acc.createdCount += Number((r as { createdCount?: number }).createdCount || 0);
        acc.updatedCount += Number((r as { updatedCount?: number }).updatedCount || 0);
        return acc;
      },
      { itemCount: 0, normalizedCount: 0, createdCount: 0, updatedCount: 0 }
    );

    if (runs.length === 1) {
      return ok({ ...runs[0], summary }, doNormalize ? 'Import et normalisation termines' : 'Import termine');
    }

    return ok({ runs, summary }, doNormalize ? 'Imports et normalisation termines' : 'Imports termines');
  } catch (error) {
    if (error instanceof Error) {
      return fail(error.message, 400, error);
    }
    return fail('Erreur serveur', 500, error);
  }
}
