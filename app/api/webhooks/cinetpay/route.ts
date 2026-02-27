import { NextRequest } from 'next/server';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const transactionId = body.transaction_id || body.transactionId;
    const status = String(body.status || '').toUpperCase();

    if (!transactionId) return fail('transaction_id requis', 400);

    const order = await prisma.order.findFirst({ where: { paymentId: transactionId } });
    if (!order) return fail('Commande non trouvee', 404);

    if (order.paymentStatus === PaymentStatus.SUCCEEDED) {
      return ok({ idempotent: true, orderId: order.id });
    }

    const successStates = new Set(['ACCEPTED', 'SUCCESS', 'SUCCEEDED', 'COMPLETED']);
    const isSuccess = successStates.has(status);

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: isSuccess ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED,
          status: isSuccess ? OrderStatus.PAYMENT_CONFIRMED : OrderStatus.PENDING_PAYMENT,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          from: order.status,
          to: isSuccess ? OrderStatus.PAYMENT_CONFIRMED : order.status,
          note: `Webhook CinetPay: ${status}`,
          visibleToClient: isSuccess,
        },
      });

      await tx.activityLog.create({
        data: {
          action: 'CINETPAY_WEBHOOK',
          entity: 'Order',
          entityId: order.id,
          metadata: body,
        },
      });

      if (isSuccess) {
        const admins = await tx.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true },
        });

        if (admins.length > 0) {
          await tx.notification.createMany({
            data: admins.map((admin) => ({
              userId: admin.id,
              title: 'Nouvelle commande payee',
              message: `La commande ${order.orderNumber} est payee. Action admin requise: commander chez le fournisseur.`,
            })),
          });
        }
      }
    });

    return ok({ processed: true, orderId: order.id });
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
