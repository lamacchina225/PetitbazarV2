import { NextRequest } from 'next/server';
import { Prisma, ProductStatus, SourcePlatform, UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getPagination } from '@/lib/pagination';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const category = (searchParams.get('category') || '').trim();
    const { page, limit, skip } = getPagination(searchParams);

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(category ? { category: { slug: category } } : {}),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return ok({ products, total, page, limit, hasMore: skip + products.length < total });
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.ADMIN) return fail('Interdit', 403);

    const body = await request.json();
    const {
      name,
      slug,
      description,
      originalPrice,
      salePrice,
      cost,
      images,
      stock,
      sku,
      sourcePlatform,
      sourceUrl,
      sourceProductId,
      categoryId,
      featured,
      status,
    } = body;

    if (!name || !slug || !sku || !sourceUrl || !sourceProductId || !categoryId) {
      return fail('Donnees invalides', 400);
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || null,
        originalPrice: Number(originalPrice || 0),
        salePrice: Number(salePrice || 0),
        cost: Number(cost || 0),
        discount: Math.max(0, Math.round(((Number(originalPrice || 0) - Number(salePrice || 0)) / Math.max(1, Number(originalPrice || 0))) * 100)),
        images: Array.isArray(images) ? images : [],
        stock: Number(stock || 0),
        sku,
        sourcePlatform: (sourcePlatform as SourcePlatform) || SourcePlatform.OTHER,
        sourceUrl,
        sourceProductId,
        categoryId,
        featured: Boolean(featured),
        status: (status as ProductStatus) || ProductStatus.ACTIVE,
      },
    });

    return ok(product, 'Produit cree', 201);
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
