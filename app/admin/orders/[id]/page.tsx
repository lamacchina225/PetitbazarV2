'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { ORDER_STATUSES } from '@/lib/config';

type OrderDetails = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  deliveryCity: string;
  deliveryCommune: string | null;
  deliveryAddress: string;
  deliveryPhone: string;
  createdAt: string;
  user: { email: string | null; firstName: string | null; lastName: string | null } | null;
  items: Array<{ id: string; quantity: number; price: number; product: { name: string } }>;
  statuses: Array<{ id: string; from: string | null; to: string; note: string | null; createdAt: string }>;
};

const ADMIN_TARGETS = ['ORDERED_FROM_SUPPLIER', 'CANCELLED'] as const;

export default function AdminOrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') router.push('/');
  }, [status, session, router]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/orders/${params.id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Erreur chargement');
        setOrder(json.data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erreur chargement');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchOrder();
  }, [params.id]);

  const nextActions = useMemo(() => {
    if (!order) return [];
    if (order.status === 'PAYMENT_CONFIRMED') return ['ORDERED_FROM_SUPPLIER'];
    if (order.status === 'ORDERED_FROM_SUPPLIER') return [];
    return ADMIN_TARGETS.filter((s) => s !== order.status);
  }, [order]);

  const updateStatus = async (target: string) => {
    if (!order) return;
    try {
      setUpdating(true);
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: target, notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Mise a jour impossible');
      toast.success('Statut mis a jour');
      setNotes('');
      const fresh = await fetch(`/api/orders/${order.id}`);
      const freshJson = await fresh.json();
      setOrder(freshJson.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur mise a jour');
    } finally {
      setUpdating(false);
    }
  };

  if (status === 'loading' || loading) return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  if (session?.user?.role !== 'ADMIN' || !order) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Commande {order.orderNumber}</h1>
          <p className="mt-1 text-slate-600">Client: {order.user?.email || 'Non renseigne'}</p>
        </div>
        <Link href="/admin/orders" className="rounded border border-slate-300 px-4 py-2 hover:bg-slate-50">
          Retour
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 text-xl font-semibold">Articles</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded border border-slate-200 p-3">
                <p className="font-medium">{item.product.name}</p>
                <p className="text-sm text-slate-600">
                  {item.quantity} x {item.price.toLocaleString('fr-CI')} FCFA
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-xl font-semibold">Statut</h2>
            <p className="mb-2 text-sm text-slate-600">
              Actuel: {ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES]?.label || order.status}
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Note interne (optionnel)"
              rows={3}
              className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <div className="flex flex-wrap gap-2">
              {nextActions.map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => updateStatus(target)}
                  disabled={updating}
                  className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {ORDER_STATUSES[target as keyof typeof ORDER_STATUSES]?.label || target}
                </button>
              ))}
            </div>
            {order.status === 'ORDERED_FROM_SUPPLIER' && (
              <Link href="/admin/shipments/new" className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:underline">
                Ajouter cette commande a une expedition
              </Link>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-xl font-semibold">Livraison</h2>
            <p className="text-sm text-slate-600">{order.deliveryCity}</p>
            <p className="text-sm text-slate-600">{order.deliveryCommune || '-'}</p>
            <p className="text-sm text-slate-600">{order.deliveryAddress}</p>
            <p className="text-sm text-slate-600">{order.deliveryPhone}</p>
            <p className="mt-3 font-semibold">{order.total.toLocaleString('fr-CI')} FCFA</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-xl font-semibold">Historique</h2>
        <div className="space-y-2">
          {order.statuses.map((s) => (
            <p key={s.id} className="text-sm text-slate-700">
              {new Date(s.createdAt).toLocaleString('fr-CI')} - {s.from || 'START'} -&gt; {s.to} {s.note ? `(${s.note})` : ''}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
