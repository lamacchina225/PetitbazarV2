import { NextRequest } from 'next/server';
import { ShipmentStatus, UserRole } from '@prisma/client';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.GESTIONNAIRE) return fail('Interdit', 403);

    const { status, notes } = await request.json();
    if (!Object.values(ShipmentStatus).includes(status)) {
      return fail('Statut invalide', 400);
    }

    const shipment = await prisma.shipmentToAbidjan.update({
      where: { id: params.id },
      data: {
        status,
        notes: notes || undefined,
        ...(status === ShipmentStatus.RECEIVED_IN_ABIDJAN
          ? { receivedById: session.user.id }
          : {}),
      },
      include: { orders: true },
    });

    if (status === ShipmentStatus.RECEIVED_IN_ABIDJAN) {
      const orderIds = shipment.orders.map((o) => o.orderId);
      await prisma.order.updateMany({
        where: { id: { in: orderIds } },
        data: { status: 'IN_PREPARATION' },
      });
      await prisma.orderStatusHistory.createMany({
        data: orderIds.map((orderId) => ({
          orderId,
          from: 'IN_TRANSIT_TO_ABIDJAN',
          to: 'IN_PREPARATION',
          actorId: session.user.id,
          visibleToClient: true,
        })),
      });
    }

    return ok(shipment, 'Expedition mise a jour');
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
