import { NextRequest } from 'next/server';
import bcryptjs from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.ADMIN) return fail('Interdit', 403);

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        city: true,
        commune: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) return fail('Utilisateur introuvable', 404);
    return ok({ user });
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.ADMIN) return fail('Interdit', 403);

    const { password } = await request.json();
    if (!password || String(password).length < 6) {
      return fail('Mot de passe invalide (minimum 6 caracteres)', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) return fail('Utilisateur introuvable', 404);

    await prisma.user.update({
      where: { id: params.id },
      data: { password: await bcryptjs.hash(String(password), 10) },
    });

    return ok({ updated: true }, 'Mot de passe mis a jour');
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
