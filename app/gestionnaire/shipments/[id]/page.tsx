'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

type ShipmentDetails = {
  id: string;
  status: string;
  carrier: string | null;
  trackingNumber: string | null;
  notes: string | null;
  orders: Array<{
    order: {
      id: string;
      orderNumber: string;
      status: string;
      total: number;
      user: { email: string | null } | null;
    };
  }>;
};

export default function GestionnaireShipmentDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [shipment, setShipment] = useState<ShipmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && session?.user?.role !== 'GESTIONNAIRE') router.push('/');
  }, [status, session, router]);

  const loadShipment = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/gestionnaire/shipments/${params.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Erreur chargement');
      setShipment(json.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) loadShipment();
  }, [params.id]);

  const confirmReception = async () => {
    if (!shipment) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/gestionnaire/shipments/${shipment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'RECEIVED_IN_ABIDJAN',
          notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Mise a jour impossible');
      toast.success('Reception confirmee');
      await loadShipment();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur mise a jour');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  if (session?.user?.role !== 'GESTIONNAIRE' || !shipment) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Colis {shipment.trackingNumber || shipment.id.slice(-8).toUpperCase()}</h1>
          <p className="mt-1 text-slate-600">Statut: {shipment.status}</p>
        </div>
        <Link href="/gestionnaire/shipments" className="rounded border border-slate-300 px-4 py-2 hover:bg-slate-50">
          Retour
        </Link>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-600">Transporteur: {shipment.carrier || '-'}</p>
        <p className="text-sm text-slate-600">Tracking: {shipment.trackingNumber || '-'}</p>
        <p className="text-sm text-slate-600">Notes actuelles: {shipment.notes || '-'}</p>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-xl font-semibold">Commandes contenues</h2>
        <div className="space-y-2">
          {shipment.orders.map((entry) => (
            <div key={entry.order.id} className="flex items-center justify-between rounded border border-slate-200 p-3">
              <div>
                <p className="font-semibold">{entry.order.orderNumber}</p>
                <p className="text-xs text-slate-600">{entry.order.user?.email || '-'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm">{entry.order.status}</p>
                <p className="text-sm font-semibold">{entry.order.total.toLocaleString('fr-CI')} FCFA</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-xl font-semibold">Action</h2>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Note reception (optionnel)"
          className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <button
          type="button"
          onClick={confirmReception}
          disabled={saving || shipment.status !== 'SENT_TO_ABIDJAN'}
          className="rounded bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? 'Validation...' : 'Confirmer reception a Abidjan'}
        </button>
      </div>
    </div>
  );
}
