import { UserRole } from '@prisma/client';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.ADMIN) return fail('Interdit', 403);

    const jobs = await prisma.importJob.findMany({
      include: { raws: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return ok({ jobs });
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
