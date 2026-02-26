import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';
import { CLIENT_VISIBLE_STATUSES } from '@/lib/order-status';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: { include: { product: true } },
        statuses: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!order) return fail('Commande non trouvee', 404);
    if (session.user.role === 'CLIENT' && order.userId !== session.user.id) return fail('Interdit', 403);

    const safeStatuses =
      session.user.role === 'CLIENT'
        ? order.statuses.filter((s) => s.visibleToClient && CLIENT_VISIBLE_STATUSES.includes(s.to))
        : order.statuses;

    return ok({ ...order, statuses: safeStatuses });
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
