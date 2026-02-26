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
    });

    return ok({ processed: true, orderId: order.id });
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
