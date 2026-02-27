import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    if (process.env.NEXT_PUBLIC_ENABLE_PAYMENT_STRIPE === 'false') {
      return fail('Paiement par carte indisponible pour le moment', 503);
    }

    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);

    const { orderId, amount, description } = await request.json();
    if (!orderId || !amount) return fail('orderId et amount requis', 400);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return fail('Commande non trouvee', 404);
    if (order.userId !== session.user.id && session.user.role !== 'ADMIN') return fail('Interdit', 403);
    if (order.paymentMethod !== PaymentMethod.STRIPE) {
      return fail('Cette commande nest pas en paiement carte', 400);
    }
    if (order.paymentStatus === PaymentStatus.SUCCEEDED) {
      return ok({ paymentUrl: '/my-orders?payment=already-paid', alreadyPaid: true });
    }

    const forceTestMode = process.env.NEXT_PUBLIC_ENABLE_TEST_PAYMENTS === 'true';
    const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXTAUTH_URL);

    if (forceTestMode || !stripeConfigured) {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentId: `STRIPE-TEST-${orderId}-${Date.now()}`,
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
            note: 'Paiement carte valide en mode test',
          },
        });

        const admins = await tx.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
        if (admins.length > 0) {
          await tx.notification.createMany({
            data: admins.map((admin) => ({
              userId: admin.id,
              title: 'Nouvelle commande payee (carte test)',
              message: `La commande ${order.orderNumber} est marquee payee par carte en mode test.`,
            })),
          });
        }
      });

      return ok({
        paymentUrl: '/my-orders?payment=success&mode=stripe-test',
        transactionId: `STRIPE-TEST-${orderId}`,
        testMode: true,
      });
    }

    const sessionStripe = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'xof',
            unit_amount: Math.round(Number(amount)),
            product_data: {
              name: `Commande ${order.orderNumber}`,
              description: description || `Paiement commande ${order.orderNumber}`,
            },
          },
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/my-orders?payment=stripe-success&orderId=${orderId}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/checkout?payment=cancelled`,
      metadata: {
        orderId,
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentId: sessionStripe.id },
    });

    return ok({
      paymentUrl: sessionStripe.url,
      transactionId: sessionStripe.id,
      provider: 'stripe',
    });
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
