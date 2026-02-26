import { UserRole } from '@prisma/client';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.GESTIONNAIRE) return fail('Interdit', 403);

    const shipments = await prisma.shipmentToAbidjan.findMany({
      where: { status: { in: ['SENT_TO_ABIDJAN', 'RECEIVED_IN_ABIDJAN'] } },
      include: { orders: { include: { order: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return ok({ shipments });
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
