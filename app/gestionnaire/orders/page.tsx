'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ORDER_STATUSES } from '@/lib/config';
import { toast } from 'sonner';

interface Order {
  id: string;
  orderNumber: string;
  total: number | null;
  status: string;
  createdAt: Date;
  deliveryCommune: string;
}

export default function GestionnaireOrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && session?.user?.role !== 'GESTIONNAIRE') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/gestionnaire/orders', window.location.origin);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', '10');

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        setOrders(data.data?.orders || []);
        setTotal(data.data?.total || 0);
      }
    } catch (error) {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  if (session?.user?.role !== 'GESTIONNAIRE') return null;

  const itemsPerPage = 10;
  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Commandes à Livrer</h1>
          <p className="mt-2 text-slate-600">Commandes arrivées à Abidjan et prêtes pour la livraison</p>
        </div>

        {/* Table */}
        <div className="rounded-lg bg-white shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-600">Chargement...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-slate-600">Aucune commande trouvée</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">N° Commande</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Commune</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Montant</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Statut</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">{order.orderNumber}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{order.deliveryCommune}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{order.total?.toLocaleString()} FCFA</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-block rounded-full px-3 py-1 text-white bg-slate-600 text-xs">
                            {ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES]?.label || order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{new Date(order.createdAt).toLocaleDateString('fr-CI')}</td>
                        <td className="px-6 py-4 text-sm">
                          <Link href={`/gestionnaire/orders/${order.id}`} className="text-blue-600 hover:underline">
                            Gérer
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-center gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="rounded px-3 py-1 disabled:opacity-50 hover:bg-slate-200"
                >
                  ← Précédent
                </button>
                <span className="text-sm text-slate-600">
                  Page {page} sur {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="rounded px-3 py-1 disabled:opacity-50 hover:bg-slate-200"
                >
                  Suivant →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

