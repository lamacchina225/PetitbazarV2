import { NextRequest } from 'next/server';
import { OrderStatus, UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';
import { canTransition, isVisibleToClient } from '@/lib/order-status';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.GESTIONNAIRE) {
      return fail('Interdit', 403);
    }

    const { status, notes } = await request.json();
    const target = status as OrderStatus;

    const order = await prisma.order.findUnique({ where: { id: params.id } });
    if (!order) return fail('Commande non trouvee', 404);

    if (!canTransition(order.status, target)) {
      return fail('Transition de statut invalide', 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const o = await tx.order.update({
        where: { id: params.id },
        data: { status: target },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: params.id,
          from: order.status,
          to: target,
          note: notes || null,
          actorId: session.user.id,
          visibleToClient: isVisibleToClient(target),
        },
      });

      return o;
    });

    return ok(updated, 'Statut mis a jour');
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
