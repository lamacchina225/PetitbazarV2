import { NextRequest } from 'next/server';
import { Prisma, ProductStatus, SourcePlatform, UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getPagination } from '@/lib/pagination';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const isAdmin = session?.user.role === UserRole.ADMIN;
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const category = (searchParams.get('category') || '').trim();
    const status = (searchParams.get('status') || '').trim();
    const featured = (searchParams.get('featured') || '').trim();
    const inStock = (searchParams.get('inStock') || '').trim();
    const sort = (searchParams.get('sort') || 'newest').trim();
    const minPrice = Number(searchParams.get('minPrice') || 0);
    const maxPrice = Number(searchParams.get('maxPrice') || 0);
    const { page, limit, skip } = getPagination(searchParams);

    const whereStatus: Prisma.ProductWhereInput['status'] =
      isAdmin && status === 'all'
        ? undefined
        : status && Object.values(ProductStatus).includes(status as ProductStatus)
          ? (status as ProductStatus)
          : ProductStatus.ACTIVE;

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { salePrice: 'asc' };
    if (sort === 'price_desc') orderBy = { salePrice: 'desc' };
    if (sort === 'name_asc') orderBy = { name: 'asc' };
    if (sort === 'name_desc') orderBy = { name: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };

    const where: Prisma.ProductWhereInput = {
      ...(whereStatus ? { status: whereStatus } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(category ? { category: { slug: category } } : {}),
      ...(featured === 'true' ? { featured: true } : {}),
      ...(inStock === 'true' ? { stock: { gt: 0 } } : {}),
      ...(minPrice > 0 || maxPrice > 0
        ? {
            salePrice: {
              ...(minPrice > 0 ? { gte: minPrice } : {}),
              ...(maxPrice > 0 ? { lte: maxPrice } : {}),
            },
          }
        : {}),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        skip,
        take: limit,
        orderBy,
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
      sizes,
      variants,
    } = body;

    if (!name || !slug || !sku || !sourceUrl || !sourceProductId || !categoryId) {
      return fail('Donnees invalides', 400);
    }

    const original = Number(originalPrice || 0);
    const sale = Number(salePrice || 0);
    const parsedCost = Number(cost || 0);
    const parsedStock = Number(stock || 0);
    if (original <= 0 || sale <= 0 || parsedCost < 0 || parsedStock < 0) {
      return fail('Prix/stock invalides', 400);
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id: String(categoryId) },
      select: { id: true },
    });
    if (!existingCategory) return fail('Categorie introuvable', 400);

    const product = await prisma.product.create({
      data: {
        name: String(name).trim(),
        slug: String(slug).trim().toLowerCase(),
        description: description || null,
        originalPrice: original,
        salePrice: sale,
        cost: parsedCost,
        discount: Math.max(0, Math.round(((original - sale) / Math.max(1, original)) * 100)),
        images: Array.isArray(images) ? images : [],
        stock: parsedStock,
        sku: String(sku).trim().toUpperCase(),
        sourcePlatform: (sourcePlatform as SourcePlatform) || SourcePlatform.OTHER,
        sourceUrl: String(sourceUrl).trim(),
        sourceProductId: String(sourceProductId).trim(),
        categoryId,
        featured: Boolean(featured),
        sizes: Array.isArray(sizes) ? sizes.map((s: unknown) => String(s)).filter(Boolean) : [],
        variants: variants ?? null,
        status:
          status && Object.values(ProductStatus).includes(status as ProductStatus)
            ? (status as ProductStatus)
            : ProductStatus.ACTIVE,
      },
    });

    return ok(product, 'Produit cree', 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return fail('Conflit de contrainte unique (slug/sku/source)', 409);
    }
    return fail('Erreur serveur', 500, error);
  }
}
