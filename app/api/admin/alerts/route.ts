import { OrderStatus, UserRole } from '@prisma/client';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.ADMIN) return fail('Interdit', 403);

    const [newPaidOrders, supplierOrdered, inTransitToAbidjan] = await Promise.all([
      prisma.order.count({ where: { status: OrderStatus.PAYMENT_CONFIRMED } }),
      prisma.order.count({ where: { status: OrderStatus.ORDERED_FROM_SUPPLIER } }),
      prisma.order.count({ where: { status: OrderStatus.IN_TRANSIT_TO_ABIDJAN } }),
    ]);

    return ok({
      bubble: newPaidOrders,
      newPaidOrders,
      supplierOrdered,
      inTransitToAbidjan,
    });
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
