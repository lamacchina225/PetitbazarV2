'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ORDER_STATUSES } from '@/lib/config';
import { toast } from 'sonner';
import { Order, OrderStatus, User } from '@prisma/client';

interface OrderWithUser extends Order {
  user: User | null;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<OrderWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/admin/orders', window.location.origin);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', '10');
      if (statusFilter) url.searchParams.set('status', statusFilter);

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        setOrders(data.data?.orders || []);
        setTotal(data.data?.total || 0);
      }
    } catch {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  const getQuickTargets = (current: OrderStatus): OrderStatus[] => {
    const nextByStatus: Partial<Record<OrderStatus, OrderStatus[]>> = {
      [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PAYMENT_CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.PAYMENT_CONFIRMED]: [OrderStatus.ORDERED_FROM_SUPPLIER, OrderStatus.CANCELLED],
      [OrderStatus.ORDERED_FROM_SUPPLIER]: [OrderStatus.IN_TRANSIT_TO_ABIDJAN],
      [OrderStatus.IN_TRANSIT_TO_ABIDJAN]: [OrderStatus.RECEIVED_IN_ABIDJAN],
      [OrderStatus.RECEIVED_IN_ABIDJAN]: [OrderStatus.IN_PREPARATION],
      [OrderStatus.IN_PREPARATION]: [OrderStatus.IN_DELIVERY, OrderStatus.CANCELLED],
      [OrderStatus.IN_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
    };
    return nextByStatus[current] || [];
  };

  const quickUpdateStatus = async (orderId: string, target: OrderStatus) => {
    try {
      setUpdatingOrderId(orderId);
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: target }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Mise a jour impossible');
      toast.success('Statut mis a jour');
      await fetchOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur mise a jour');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (status === 'loading') return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  if (session?.user?.role !== 'ADMIN') return null;

  const itemsPerPage = 10;
  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Gestion des commandes</h1>
          <p className="mt-2 text-slate-600">Suivi et traitement de toutes les commandes</p>
        </div>

        <div className="mb-6 flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(ORDER_STATUSES).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          {loading ? (
            <div className="p-8 text-center text-slate-600">Chargement...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-slate-600">Aucune commande trouvee</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Ndeg commande</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Client</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Total</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Statut</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {orders.map((order) => {
                      const targets = getQuickTargets(order.status as OrderStatus);
                      return (
                        <tr key={order.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm font-semibold text-slate-900">{order.orderNumber}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{order.user?.email || '-'}</td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{order.total?.toLocaleString()} FCFA</td>
                          <td className="px-6 py-4 text-sm">
                            <span className="inline-block rounded-full bg-slate-600 px-3 py-1 text-xs text-white">
                              {ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES]?.label || order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{new Date(order.createdAt).toLocaleDateString('fr-CI')}</td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex items-center gap-2">
                              {targets.length > 0 && (
                                <select
                                  defaultValue=""
                                  disabled={updatingOrderId === order.id}
                                  onChange={(e) => {
                                    const value = e.target.value as OrderStatus;
                                    if (!value) return;
                                    quickUpdateStatus(order.id, value);
                                    e.currentTarget.value = '';
                                  }}
                                  className="rounded border border-slate-300 px-2 py-1 text-xs"
                                >
                                  <option value="">Changer</option>
                                  {targets.map((target) => (
                                    <option key={target} value={target}>
                                      {ORDER_STATUSES[target]?.label || target}
                                    </option>
                                  ))}
                                </select>
                              )}
                              <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline">
                                Details
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-center gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="rounded px-3 py-1 hover:bg-slate-200 disabled:opacity-50"
                >
                  Precedent
                </button>
                <span className="text-sm text-slate-600">
                  Page {page} sur {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="rounded px-3 py-1 hover:bg-slate-200 disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
