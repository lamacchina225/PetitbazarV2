import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api';
import { cinetpayService } from '@/services/paymentService';

export async function GET(_request: NextRequest, { params }: { params: { transactionId: string } }) {
  try {
    const status = await cinetpayService.checkPaymentStatus(params.transactionId);
    if (!status.success) return fail(status.error || 'Echec verification', 400);
    return ok(status);
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
