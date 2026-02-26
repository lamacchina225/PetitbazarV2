import { NextRequest } from 'next/server';
import { ShipmentStatus, UserRole } from '@prisma/client';
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
        include: { orders: true },
      });

      await tx.order.updateMany({
        where: { id: { in: orderIds } },
        data: { status: 'IN_TRANSIT_TO_ABIDJAN' },
      });

      await tx.orderStatusHistory.createMany({
        data: orderIds.map((orderId: string) => ({
          orderId,
          from: 'ORDERED_FROM_SUPPLIER',
          to: 'IN_TRANSIT_TO_ABIDJAN',
          actorId: session.user.id,
          visibleToClient: false,
        })),
      });

      return s;
    });

    return ok(shipment, 'Expedition creee', 201);
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
