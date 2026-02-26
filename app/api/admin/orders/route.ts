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
    const status = searchParams.get('status') || undefined;
    const { page, limit, skip } = getPagination(searchParams);

    const where = status ? { status: status as never } : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { user: true, items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return ok({ orders, total, page, limit, hasMore: skip + orders.length < total });
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
