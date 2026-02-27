import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/api';

export async function GET(_request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return ok({ categories });
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
