import { UserRole } from '@prisma/client';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.ADMIN) return fail('Interdit', 403);

    const [totalOrders, totalUsers, pendingOrders, revenue] = await Promise.all([
      prisma.order.count(),
      prisma.user.count({ where: { role: UserRole.CLIENT } }),
      prisma.order.count({ where: { status: 'PENDING_PAYMENT' } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: 'DELIVERED' } }),
    ]);

    return ok({
      totalOrders,
      totalUsers,
      pendingOrders,
      totalRevenue: revenue._sum.total || 0,
    });
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
