import { NextRequest } from 'next/server';
import { ProductStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const withCounts = searchParams.get('withCounts') === 'true';
    const withProducts = searchParams.get('withProducts') === 'true';

    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        featured: true,
      },
    });

    if (!withCounts && !withProducts) return ok({ categories });

    const counts = await prisma.product.groupBy({
      by: ['categoryId'],
      where: { status: ProductStatus.ACTIVE },
      _count: { _all: true },
    });
    const countById = new Map(counts.map((row) => [row.categoryId, row._count._all]));

    const enriched = categories
      .map((category) => ({
        ...category,
        productsCount: countById.get(category.id) || 0,
      }))
      .filter((category) => (withProducts ? category.productsCount > 0 : true));

    return ok({ categories: enriched });
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
