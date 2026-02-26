import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';
import { cinetpayService } from '@/services/paymentService';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);

    const { orderId, amount, description } = await request.json();
    if (!orderId || !amount) return fail('orderId et amount requis', 400);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return fail('Commande non trouvee', 404);
    if (order.userId !== session.user.id && session.user.role !== 'ADMIN') return fail('Interdit', 403);

    const transactionId = `PB-${orderId}-${Date.now()}`;
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
