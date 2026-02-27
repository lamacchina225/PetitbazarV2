import { NextRequest } from 'next/server';
import { OrderStatus, ShipmentStatus, UserRole } from '@prisma/client';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.ADMIN) return fail('Interdit', 403);

    const shipments = await prisma.shipmentToAbidjan.findMany({
      include: {
        orders: { include: { order: true } },
        createdBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return ok({ shipments });
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.ADMIN) return fail('Interdit', 403);

    const { orderIds, carrier, trackingNumber, notes } = await request.json();

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return fail('orderIds requis', 400);
    }

    const shipment = await prisma.$transaction(async (tx) => {
      const orders = await tx.order.findMany({
        where: { id: { in: orderIds } },
        select: { id: true, orderNumber: true, status: true },
      });

      if (orders.length !== orderIds.length) {
        throw new Error('Certaines commandes sont introuvables');
      }

      const invalidOrders = orders.filter((o) => o.status !== OrderStatus.ORDERED_FROM_SUPPLIER);
      if (invalidOrders.length > 0) {
        throw new Error('Toutes les commandes doivent etre au statut "commande chez fournisseur"');
      }

      const s = await tx.shipmentToAbidjan.create({
        data: {
          carrier: carrier || null,
          trackingNumber: trackingNumber || null,
          notes: notes || null,
          createdById: session.user.id,
          status: ShipmentStatus.SENT_TO_ABIDJAN,
          orders: {
            create: orderIds.map((orderId: string) => ({ orderId })),
          },
        },
        include: {
          orders: {
            include: {
              order: {
                select: { id: true, orderNumber: true },
              },
            },
          },
        },
      });

      await tx.order.updateMany({
        where: { id: { in: orderIds } },
        data: { status: OrderStatus.IN_TRANSIT_TO_ABIDJAN },
      });

      await tx.orderStatusHistory.createMany({
        data: orders.map((order) => ({
          orderId: order.id,
          from: order.status,
          to: OrderStatus.IN_TRANSIT_TO_ABIDJAN,
          actorId: session.user.id,
          visibleToClient: false,
        })),
      });

      const gestionnaires = await tx.user.findMany({
        where: { role: UserRole.GESTIONNAIRE },
        select: { id: true },
      });

      if (gestionnaires.length > 0) {
        const orderNumbers = orders.map((o) => o.orderNumber).join(', ');
        await tx.notification.createMany({
          data: gestionnaires.map((g) => ({
            userId: g.id,
            title: 'Nouveau colis en route vers Abidjan',
            message: `Une expedition est en transit avec les commandes: ${orderNumbers}`,
          })),
        });
      }

      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'SHIPMENT_CREATED',
          entity: 'ShipmentToAbidjan',
          entityId: s.id,
          metadata: {
            orderIds,
            carrier: carrier || null,
            trackingNumber: trackingNumber || null,
          },
        },
      });

      return s;
    });

    return ok(shipment, 'Expedition creee', 201);
  } catch (error) {
    if (error instanceof Error) {
      return fail(error.message, 400);
    }
    return fail('Erreur serveur', 500, error);
  }
}
