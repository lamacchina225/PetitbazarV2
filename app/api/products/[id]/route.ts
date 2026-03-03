import { NextRequest } from 'next/server';
import { Prisma, ProductStatus, SourcePlatform, UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    const isAdmin = session?.user.role === UserRole.ADMIN;

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: { category: true, reviews: true },
    });

    if (!product || (!isAdmin && product.status !== ProductStatus.ACTIVE)) {
      return fail('Produit non trouve', 404);
    }

    return ok(product);
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.ADMIN) return fail('Interdit', 403);

    const body = await request.json();
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
      select: { id: true, originalPrice: true, salePrice: true },
    });
    if (!existing) return fail('Produit non trouve', 404);

    const nextOriginal =
      body.originalPrice !== undefined ? Number(body.originalPrice) : existing.originalPrice;
    const nextSale = body.salePrice !== undefined ? Number(body.salePrice) : existing.salePrice;

    if (nextOriginal <= 0 || nextSale <= 0) {
      return fail('Prix invalides', 400);
    }
    if (body.stock !== undefined && Number(body.stock) < 0) {
      return fail('Stock invalide', 400);
    }

    if (body.categoryId !== undefined) {
      const category = await prisma.category.findUnique({
        where: { id: String(body.categoryId) },
        select: { id: true },
      });
      if (!category) return fail('Categorie introuvable', 400);
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
        ...(body.slug !== undefined ? { slug: String(body.slug).trim().toLowerCase() } : {}),
        ...(body.description !== undefined ? { description: body.description || null } : {}),
        ...(body.originalPrice !== undefined ? { originalPrice: Number(body.originalPrice) } : {}),
        ...(body.salePrice !== undefined ? { salePrice: Number(body.salePrice) } : {}),
        ...(body.cost !== undefined ? { cost: Number(body.cost) } : {}),
        ...(body.images !== undefined ? { images: Array.isArray(body.images) ? body.images : [] } : {}),
        ...(body.stock !== undefined ? { stock: Number(body.stock) } : {}),
        ...(body.sku !== undefined ? { sku: String(body.sku).trim().toUpperCase() } : {}),
        ...(body.sourcePlatform !== undefined
          ? { sourcePlatform: body.sourcePlatform as SourcePlatform }
          : {}),
        ...(body.sourceUrl !== undefined ? { sourceUrl: String(body.sourceUrl).trim() } : {}),
        ...(body.sourceProductId !== undefined
          ? { sourceProductId: String(body.sourceProductId).trim() }
          : {}),
        ...(body.categoryId !== undefined ? { categoryId: String(body.categoryId) } : {}),
        ...(body.featured !== undefined ? { featured: Boolean(body.featured) } : {}),
        ...(body.sizes !== undefined
          ? { sizes: Array.isArray(body.sizes) ? body.sizes.map((s: unknown) => String(s)).filter(Boolean) : [] }
          : {}),
        ...(body.variants !== undefined ? { variants: body.variants ?? null } : {}),
        ...(body.status !== undefined ? { status: body.status as ProductStatus } : {}),
        discount: Math.max(0, Math.round(((nextOriginal - nextSale) / Math.max(1, nextOriginal)) * 100)),
      },
    });

    return ok(product, 'Produit mis a jour');
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return fail('Conflit de contrainte unique (slug/sku/source)', 409);
    }
    return fail('Erreur serveur', 500, error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.ADMIN) return fail('Interdit', 403);

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        _count: { select: { orderItems: true, cartItems: true } },
      },
    });

    if (!product) return fail('Produit non trouve', 404);

    if (product._count.orderItems > 0 || product._count.cartItems > 0) {
      await prisma.product.update({
        where: { id: params.id },
        data: { status: ProductStatus.ARCHIVED },
      });
      return ok({ id: params.id, archived: true }, 'Produit archive');
    }

    await prisma.product.delete({ where: { id: params.id } });
    return ok({ id: params.id, archived: false }, 'Produit supprime');
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
