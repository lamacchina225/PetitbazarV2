import { NextRequest } from 'next/server';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/api';
import { requireAuth } from '@/lib/auth-helpers';
import { getPagination } from '@/lib/pagination';

function orderNumber() {
  return `PB-${Date.now()}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as OrderStatus | null;
    const { page, limit, skip } = getPagination(searchParams);

    const where = {
      userId: session.user.id,
      ...(status ? { status } : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: { include: { product: true } }, statuses: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return ok({ orders, total, page, limit, hasMore: skip + orders.length < total });
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return fail('Non authentifie', 401);

    const body = await request.json();
    const {
      deliveryCity,
      deliveryCommune,
      deliveryAddress,
      deliveryPhone,
      paymentMethod,
    } = body;

    if (!deliveryCity || !deliveryAddress || !deliveryPhone || !paymentMethod) {
      return fail('Donnees invalides', 400);
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: { product: true },
    });

    if (cartItems.length === 0) return fail('Panier vide', 400);

    const subtotal = cartItems.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0);
    const shippingCost = 2500;
    const total = subtotal + shippingCost;

    const created = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber: orderNumber(),
          userId: session.user.id,
          deliveryCity,
          deliveryCommune: deliveryCommune || null,
          deliveryAddress,
          deliveryPhone,
          subtotal,
          shippingCost,
          total,
          paymentMethod,
          status: OrderStatus.PENDING_PAYMENT,
          paymentStatus: PaymentStatus.PENDING,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.salePrice,
            })),
          },
        },
        include: { items: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          from: null,
          to: OrderStatus.PENDING_PAYMENT,
          actorId: session.user.id,
          visibleToClient: false,
        },
      });

      await tx.cartItem.deleteMany({ where: { userId: session.user.id } });
      return order;
    });

    return ok(created, 'Commande creee', 201);
  } catch (error) {
    return fail('Erreur serveur', 500, error);
  }
}
