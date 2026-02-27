import { NextRequest } from 'next/server';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';
import { cinetpayService } from '@/services/paymentService';

export async function POST(request: NextRequest) {
  try {
    if (process.env.NEXT_PUBLIC_ENABLE_PAYMENT_CINETPAY === 'false') {
      return fail('Paiement Mobile Money indisponible pour le moment', 503);
    }

    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);

    const { orderId, amount, description } = await request.json();
    if (!orderId || !amount) return fail('orderId et amount requis', 400);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return fail('Commande non trouvee', 404);
    if (order.userId !== session.user.id && session.user.role !== 'ADMIN') return fail('Interdit', 403);
    if (order.paymentStatus === PaymentStatus.SUCCEEDED) {
      return ok({
        paymentUrl: '/my-orders?payment=already-paid',
        transactionId: order.paymentId || '',
        alreadyPaid: true,
      });
    }

    const transactionId = `PB-${orderId}-${Date.now()}`;
    const forceTestMode = process.env.NEXT_PUBLIC_ENABLE_TEST_PAYMENTS === 'true';
    const cinetpayConfigured = Boolean(
      process.env.CINETPAY_API_KEY &&
      process.env.CINETPAY_SITE_ID &&
      process.env.NEXT_PUBLIC_CINETPAY_ENDPOINT
    );

    if (forceTestMode || !cinetpayConfigured) {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentId: transactionId,
            paymentStatus: PaymentStatus.SUCCEEDED,
            status: OrderStatus.PAYMENT_CONFIRMED,
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId,
            from: order.status,
            to: OrderStatus.PAYMENT_CONFIRMED,
            actorId: session.user.id,
            visibleToClient: true,
            note: 'Paiement test valide automatiquement',
          },
        });

        const admins = await tx.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true },
        });
        if (admins.length > 0) {
          await tx.notification.createMany({
            data: admins.map((admin) => ({
              userId: admin.id,
              title: 'Nouvelle commande payee (test)',
              message: `La commande ${order.orderNumber} est marquee payee en mode test.`,
            })),
          });
        }
      });

      return ok({
        paymentUrl: '/my-orders?payment=success&mode=test',
        transactionId,
        testMode: true,
      });
    }

    const payment = await cinetpayService.createPayment(transactionId, Number(amount), 'XOF', description);

    if (!payment.success) return fail(payment.error || 'Echec creation paiement', 400);

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentId: payment.transactionId || transactionId },
    });

    return ok({ paymentUrl: payment.paymentUrl, transactionId: payment.transactionId || transactionId });
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
