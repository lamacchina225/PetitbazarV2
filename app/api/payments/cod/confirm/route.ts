import { NextRequest } from 'next/server';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    if (process.env.NEXT_PUBLIC_ENABLE_PAYMENT_COD === 'false') {
      return fail('Paiement a la livraison indisponible pour le moment', 503);
    }

    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);

    const { orderId } = await request.json();
    if (!orderId) return fail('orderId requis', 400);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return fail('Commande non trouvee', 404);
    if (order.userId !== session.user.id && session.user.role !== 'ADMIN') return fail('Interdit', 403);
    if (order.paymentMethod !== PaymentMethod.CASH_ON_DELIVERY) {
      return fail('Cette commande nest pas en paiement a la livraison', 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAYMENT_CONFIRMED,
          paymentStatus: PaymentStatus.PENDING,
          paymentId: `COD-${orderId}-${Date.now()}`,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          from: order.status,
          to: OrderStatus.PAYMENT_CONFIRMED,
          actorId: session.user.id,
          visibleToClient: true,
          note: 'Paiement a la livraison: commande validee',
        },
      });

      const admins = await tx.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            title: 'Nouvelle commande COD',
            message: `La commande ${order.orderNumber} est confirmee en paiement a la livraison.`,
          })),
        });
      }
    });

    return ok({ paymentUrl: '/my-orders?payment=cod-confirmed' }, 'Commande validee');
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
