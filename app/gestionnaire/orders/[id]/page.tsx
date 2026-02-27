'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { ORDER_STATUSES } from '@/lib/config';

type OrderDetails = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  deliveryCommune: string | null;
  deliveryAddress: string;
  deliveryPhone: string;
  items: Array<{ id: string; quantity: number; price: number; product: { name: string } }>;
  statuses: Array<{ id: string; from: string | null; to: string; createdAt: string }>;
};

export default function GestionnaireOrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && session?.user?.role !== 'GESTIONNAIRE') router.push('/');
  }, [status, session, router]);

  const loadOrder = async () => {
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

  useEffect(() => {
    if (params.id) loadOrder();
  }, [params.id]);

  const nextStatuses = useMemo(() => {
    if (!order) return [];
    if (order.status === 'RECEIVED_IN_ABIDJAN') return ['IN_PREPARATION'];
    if (order.status === 'IN_PREPARATION') return ['IN_DELIVERY'];
    if (order.status === 'IN_DELIVERY') return ['DELIVERED'];
    return [];
  }, [order]);

  const updateStatus = async (target: string) => {
    if (!order) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/gestionnaire/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: target }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Mise a jour impossible');
      toast.success('Commande mise a jour');
      await loadOrder();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur mise a jour');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  if (session?.user?.role !== 'GESTIONNAIRE' || !order) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Commande {order.orderNumber}</h1>
          <p className="mt-1 text-slate-600">
            Statut: {ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES]?.label || order.status}
          </p>
        </div>
        <Link href="/gestionnaire/orders" className="rounded border border-slate-300 px-4 py-2 hover:bg-slate-50">
          Retour
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 text-xl font-semibold">Articles</h2>
          <div className="space-y-2">
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
            <h2 className="mb-3 text-xl font-semibold">Livraison</h2>
            <p className="text-sm text-slate-600">{order.deliveryCommune || '-'}</p>
            <p className="text-sm text-slate-600">{order.deliveryAddress}</p>
            <p className="text-sm text-slate-600">{order.deliveryPhone}</p>
            <p className="mt-3 font-semibold">{order.total.toLocaleString('fr-CI')} FCFA</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-xl font-semibold">Actions statut</h2>
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => updateStatus(target)}
                  disabled={saving}
                  className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {ORDER_STATUSES[target as keyof typeof ORDER_STATUSES]?.label || target}
                </button>
              ))}
              {nextStatuses.length === 0 && (
                <p className="text-sm text-slate-600">Aucune action disponible pour ce statut.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-xl font-semibold">Historique</h2>
        <div className="space-y-2">
          {order.statuses.map((s) => (
            <p key={s.id} className="text-sm text-slate-700">
              {new Date(s.createdAt).toLocaleString('fr-CI')} - {s.from || 'START'} -&gt; {s.to}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
