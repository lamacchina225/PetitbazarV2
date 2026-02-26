import { NextRequest } from 'next/server';
import bcryptjs from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.ADMIN) return fail('Interdit', 403);

    const { firstName, lastName, email, phone, city, commune, password } = await request.json();

    if (!firstName || !lastName || !email || !password) {
      return fail('Donnees invalides', 400);
    }

    const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
    if (exists) return fail('Utilisateur deja existant', 409);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        city: city || 'Abidjan',
        commune: commune || null,
        role: UserRole.GESTIONNAIRE,
        password: await bcryptjs.hash(password, 10),
      },
    });

    return ok(user, 'Gestionnaire cree', 201);
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
