import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.ADMIN) return fail('Interdit', 403);

    const shipment = await prisma.shipmentToAbidjan.findUnique({
      where: { id: params.id },
      include: {
        createdBy: true,
        receivedBy: true,
        orders: {
          include: {
            order: {
              include: {
                user: true,
                items: { include: { product: true } },
              },
            },
          },
        },
      },
    });

    if (!shipment) return fail('Expedition introuvable', 404);
    return ok(shipment);
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
