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

    const { firstName, lastName, email, phone, city, commune, password, role } = await request.json();
    const targetRole = role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.GESTIONNAIRE;

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
        role: targetRole,
        password: await bcryptjs.hash(password, 10),
      },
    });

    return ok(user, targetRole === UserRole.ADMIN ? 'Admin cree' : 'Gestionnaire cree', 201);
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}

export async function GET() {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.ADMIN) return fail('Interdit', 403);

    const gestionnaires = await prisma.user.findMany({
      where: { role: { in: [UserRole.GESTIONNAIRE, UserRole.ADMIN] } },
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
      orderBy: { createdAt: 'desc' },
    });

    return ok({ gestionnaires });
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
