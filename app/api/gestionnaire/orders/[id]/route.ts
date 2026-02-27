import { NextRequest } from 'next/server';
import { OrderStatus, UserRole } from '@prisma/client';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { canTransition } from '@/lib/order-status';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.GESTIONNAIRE) return fail('Interdit', 403);

    const { status } = await request.json();
    const to = status as OrderStatus;
    const allowedTargets: OrderStatus[] = [
      OrderStatus.IN_PREPARATION,
      OrderStatus.IN_DELIVERY,
      OrderStatus.DELIVERED,
    ];
    if (!allowedTargets.includes(to)) {
      return fail('Statut non autorise pour le gestionnaire', 403);
    }

    const order = await prisma.order.findUnique({ where: { id: params.id } });
    if (!order) return fail('Commande non trouvee', 404);

    if (!canTransition(order.status, to)) {
      return fail('Transition invalide', 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const o = await tx.order.update({ where: { id: params.id }, data: { status: to } });
      await tx.orderStatusHistory.create({
        data: {
          orderId: params.id,
          from: order.status,
          to,
          actorId: session.user.id,
          visibleToClient: true,
        },
      });
      return o;
    });

    return ok(updated, 'Commande mise a jour');
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
