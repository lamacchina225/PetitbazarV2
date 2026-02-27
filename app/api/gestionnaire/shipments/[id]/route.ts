import { NextRequest } from 'next/server';
import { OrderStatus, ShipmentStatus, UserRole } from '@prisma/client';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.GESTIONNAIRE) return fail('Interdit', 403);

    const shipment = await prisma.shipmentToAbidjan.findUnique({
      where: { id: params.id },
      include: {
        orders: {
          include: {
            order: {
              include: {
                user: true,
                items: { include: { product: true } },
              },
            },
          },
        },
      },
    });

    if (!shipment) return fail('Expedition introuvable', 404);
    return ok(shipment);
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.GESTIONNAIRE) return fail('Interdit', 403);

    const { status, notes } = await request.json();
    if (!Object.values(ShipmentStatus).includes(status)) {
      return fail('Statut invalide', 400);
    }

    const existing = await prisma.shipmentToAbidjan.findUnique({
      where: { id: params.id },
      include: { orders: true },
    });
    if (!existing) return fail('Expedition introuvable', 404);

    const allowedNextByCurrent: Record<ShipmentStatus, ShipmentStatus[]> = {
      [ShipmentStatus.DRAFT]: [ShipmentStatus.SENT_TO_ABIDJAN],
      [ShipmentStatus.SENT_TO_ABIDJAN]: [ShipmentStatus.RECEIVED_IN_ABIDJAN],
      [ShipmentStatus.RECEIVED_IN_ABIDJAN]: [ShipmentStatus.CLOSED],
      [ShipmentStatus.CLOSED]: [],
    };
    if (!allowedNextByCurrent[existing.status].includes(status)) {
      return fail('Transition de statut expedition invalide', 400);
    }

    const shipment = await prisma.$transaction(async (tx) => {
      const updatedShipment = await tx.shipmentToAbidjan.update({
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
        const orderIds = updatedShipment.orders.map((o) => o.orderId);
        const linkedOrders = await tx.order.findMany({
          where: { id: { in: orderIds } },
          select: { id: true, status: true, orderNumber: true },
        });

        const toUpdate = linkedOrders.filter((o) => o.status === OrderStatus.IN_TRANSIT_TO_ABIDJAN);
        if (toUpdate.length > 0) {
          await tx.order.updateMany({
            where: { id: { in: toUpdate.map((o) => o.id) } },
            data: { status: OrderStatus.IN_PREPARATION },
          });

          await tx.orderStatusHistory.createMany({
            data: toUpdate.map((o) => ({
              orderId: o.id,
              from: o.status,
              to: OrderStatus.IN_PREPARATION,
              actorId: session.user.id,
              visibleToClient: true,
              note: `Colis ${updatedShipment.id} recu a Abidjan, commande passee en preparation`,
            })),
          });
        }

        const admins = await tx.user.findMany({
          where: { role: UserRole.ADMIN },
          select: { id: true },
        });
        if (admins.length > 0) {
          const orderNumbers = linkedOrders.map((o) => o.orderNumber).join(', ');
          await tx.notification.createMany({
            data: admins.map((a) => ({
              userId: a.id,
              title: 'Colis recu a Abidjan',
              message: `Le colis ${updatedShipment.id} est recu. Commandes passees en preparation: ${orderNumbers}`,
            })),
          });
        }
      }

      return updatedShipment;
    });

    return ok(shipment, 'Expedition mise a jour');
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
