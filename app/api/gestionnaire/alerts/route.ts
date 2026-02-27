import { OrderStatus, ShipmentStatus, UserRole } from '@prisma/client';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.GESTIONNAIRE) return fail('Interdit', 403);

    const [shipmentsToReceive, ordersInPreparation, ordersInDelivery] = await Promise.all([
      prisma.shipmentToAbidjan.count({ where: { status: ShipmentStatus.SENT_TO_ABIDJAN } }),
      prisma.order.count({ where: { status: OrderStatus.IN_PREPARATION } }),
      prisma.order.count({ where: { status: OrderStatus.IN_DELIVERY } }),
    ]);

    return ok({
      bubble: shipmentsToReceive + ordersInPreparation + ordersInDelivery,
      shipmentsToReceive,
      ordersToPrepare: ordersInPreparation,
      ordersInPreparation,
      ordersInDelivery,
    });
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
