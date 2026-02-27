import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import authOptions from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CLIENT_VISIBLE_STATUSES } from '@/lib/order-status';
import { OrderStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function MyOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: { include: { product: true } },
      statuses: { where: { visibleToClient: true }, orderBy: { createdAt: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const statusLabel: Record<OrderStatus, string> = {
    PENDING_PAYMENT: 'En attente de paiement',
    PAYMENT_CONFIRMED: 'Paiement confirme',
    ORDERED_FROM_SUPPLIER: 'Commande chez le fournisseur',
    IN_TRANSIT_TO_ABIDJAN: 'En transit vers Abidjan',
    RECEIVED_IN_ABIDJAN: 'Recu a Abidjan',
    IN_PREPARATION: 'En preparation',
    IN_DELIVERY: 'En livraison',
    DELIVERED: 'Livre',
    CANCELLED: 'Annule',
    REFUNDED: 'Rembourse',
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-4xl font-bold">Mes commandes</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="rounded-lg border border-slate-200 p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">{order.orderNumber}</p>
              <p className="text-sm text-slate-600">{order.total.toLocaleString('fr-CI')} FCFA</p>
            </div>
            <p className="text-sm text-slate-600">Statut actuel: {statusLabel[order.status] || order.status}</p>
            <p className="mt-1 text-xs text-slate-500">
              Historique visible: {order.statuses
                .filter((s) => CLIENT_VISIBLE_STATUSES.includes(s.to))
                .map((s) => statusLabel[s.to] || s.to)
                .join(' -> ') || '-'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

