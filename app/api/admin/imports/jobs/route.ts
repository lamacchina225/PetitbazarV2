import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getPagination } from '@/lib/pagination';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.ADMIN) return fail('Interdit', 403);

    const { searchParams } = new URL(request.url);
    const platform = (searchParams.get('platform') || '').trim();
    const status = (searchParams.get('status') || '').trim();
    const query = (searchParams.get('query') || '').trim();
    const { page, limit, skip } = getPagination(searchParams);

    const where = {
      ...(platform ? { platform: platform as never } : {}),
      ...(status ? { status: status as never } : {}),
      ...(query ? { query: { contains: query, mode: 'insensitive' as const } } : {}),
    };

    const jobs = await prisma.importJob.findMany({
      where,
      include: { raws: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
    const total = await prisma.importJob.count({ where });

    return ok({ jobs, total, page, limit, hasMore: skip + jobs.length < total });
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
