import { NextRequest } from 'next/server';
import { OrderStatus, UserRole } from '@prisma/client';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getPagination } from '@/lib/pagination';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.GESTIONNAIRE) return fail('Interdit', 403);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ACTIVE';
    const { page, limit, skip } = getPagination(searchParams);

    const managedStatuses: OrderStatus[] = [
      OrderStatus.RECEIVED_IN_ABIDJAN,
      OrderStatus.IN_PREPARATION,
      OrderStatus.IN_DELIVERY,
    ];

    const where =
      status === 'ACTIVE'
        ? { status: { in: managedStatuses } }
        : { status: status as OrderStatus };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { user: true, items: { include: { product: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return ok({ orders, total, page, limit, hasMore: skip + orders.length < total });
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
