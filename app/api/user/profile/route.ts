import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/api';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return fail('Non authentifie', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        city: true,
        commune: true,
      },
    });

    return ok(user);
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
