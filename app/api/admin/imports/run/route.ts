import { NextRequest } from 'next/server';
import { SourcePlatform, UserRole } from '@prisma/client';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';
import { runImportJob, normalizeRawToProducts } from '@/services/ingestionService';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.ADMIN) return fail('Interdit', 403);

    const { platform, query, categoryId } = await request.json();
    if (!platform || !query) return fail('platform et query requis', 400);

    const run = await runImportJob(platform as SourcePlatform, query);

    if (categoryId) {
      const normalized = await normalizeRawToProducts(run.id, categoryId);
      return ok({ ...run, ...normalized }, 'Import termine');
    }

    return ok(run, 'Import termine');
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
