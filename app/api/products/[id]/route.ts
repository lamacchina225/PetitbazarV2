import { NextRequest } from 'next/server';
import { ProductStatus, UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: { category: true, reviews: true },
    });

    if (!product || product.status !== ProductStatus.ACTIVE) {
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
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.slug !== undefined ? { slug: body.slug } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.originalPrice !== undefined ? { originalPrice: Number(body.originalPrice) } : {}),
        ...(body.salePrice !== undefined ? { salePrice: Number(body.salePrice) } : {}),
        ...(body.cost !== undefined ? { cost: Number(body.cost) } : {}),
        ...(body.images !== undefined ? { images: Array.isArray(body.images) ? body.images : [] } : {}),
        ...(body.stock !== undefined ? { stock: Number(body.stock) } : {}),
        ...(body.featured !== undefined ? { featured: Boolean(body.featured) } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
      },
    });

    return ok(product, 'Produit mis a jour');
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);
    if (session.user.role !== UserRole.ADMIN) return fail('Interdit', 403);

    await prisma.product.delete({ where: { id: params.id } });
    return ok({ id: params.id }, 'Produit supprime');
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
