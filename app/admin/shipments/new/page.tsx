'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

type ReadyOrder = {
  id: string;
  orderNumber: string;
  total: number;
  deliveryCommune: string | null;
  createdAt: string;
};

export default function NewAdminShipmentPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<ReadyOrder[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') router.push('/');
  }, [status, session, router]);

  useEffect(() => {
    const fetchReadyOrders = async () => {
      try {
        setLoading(true);
        const url = new URL('/api/admin/orders', window.location.origin);
        url.searchParams.set('status', 'ORDERED_FROM_SUPPLIER');
        url.searchParams.set('limit', '100');
        const res = await fetch(url);
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Erreur chargement');
        setOrders(json.data?.orders || []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erreur chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchReadyOrders();
  }, []);

  const totalSelected = useMemo(
    () =>
      orders
        .filter((o) => selected.includes(o.id))
        .reduce((sum, o) => sum + (o.total || 0), 0),
    [orders, selected]
  );

  const toggleOrder = (orderId: string) => {
    setSelected((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const submit = async () => {
    if (selected.length === 0) {
      toast.error('Selectionnez au moins une commande');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selected, carrier, trackingNumber, notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Creation impossible');
      toast.success('Expedition creee');
      router.push('/admin/shipments');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur creation');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  if (session?.user?.role !== 'ADMIN') return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Nouvelle expedition vers Abidjan</h1>
          <p className="mt-1 text-slate-600">Selectionnez les commandes a envoyer en groupage</p>
        </div>
        <Link href="/admin/shipments" className="rounded border border-slate-300 px-4 py-2 hover:bg-slate-50">
          Retour
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 text-xl font-semibold">Commandes disponibles</h2>
          {orders.length === 0 ? (
            <p className="text-slate-600">Aucune commande au statut "commande chez fournisseur".</p>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <label key={order.id} className="flex cursor-pointer items-center justify-between rounded border border-slate-200 p-3 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(order.id)}
                      onChange={() => toggleOrder(order.id)}
                    />
                    <div>
                      <p className="font-semibold">{order.orderNumber}</p>
                      <p className="text-xs text-slate-600">
                        {order.deliveryCommune || '-'} - {new Date(order.createdAt).toLocaleDateString('fr-CI')}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium">{order.total.toLocaleString('fr-CI')} FCFA</p>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold">Informations expedition</h2>
          <input
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="Transporteur (optionnel)"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Numero de suivi (optionnel)"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Notes (optionnel)"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <div className="rounded bg-slate-50 p-3 text-sm text-slate-700">
            <p>Commandes selectionnees: {selected.length}</p>
            <p>Montant cumule: {totalSelected.toLocaleString('fr-CI')} FCFA</p>
          </div>
          <button
            type="button"
            disabled={submitting || selected.length === 0}
            onClick={submit}
            className="w-full rounded bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? 'Creation...' : 'Creer l expedition'}
          </button>
        </div>
      </div>
    </div>
  );
}
