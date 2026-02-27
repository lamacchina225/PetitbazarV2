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
  createdAt: string;
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

export default function AdminShipmentDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [shipment, setShipment] = useState<ShipmentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') router.push('/');
  }, [status, session, router]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/shipments/${params.id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Erreur chargement');
        setShipment(json.data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erreur chargement');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchDetails();
  }, [params.id]);

  if (status === 'loading' || loading) return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  if (session?.user?.role !== 'ADMIN' || !shipment) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Expedition {shipment.trackingNumber || shipment.id.slice(-8).toUpperCase()}</h1>
          <p className="mt-1 text-slate-600">Statut: {shipment.status}</p>
        </div>
        <Link href="/admin/shipments" className="rounded border border-slate-300 px-4 py-2 hover:bg-slate-50">
          Retour
        </Link>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-600">Transporteur: {shipment.carrier || '-'}</p>
        <p className="text-sm text-slate-600">Tracking: {shipment.trackingNumber || '-'}</p>
        <p className="text-sm text-slate-600">Notes: {shipment.notes || '-'}</p>
        <p className="text-sm text-slate-600">Cree le: {new Date(shipment.createdAt).toLocaleString('fr-CI')}</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-xl font-semibold">Commandes du colis</h2>
        <div className="space-y-2">
          {shipment.orders.map((item) => (
            <div key={item.order.id} className="flex items-center justify-between rounded border border-slate-200 p-3">
              <div>
                <p className="font-semibold">{item.order.orderNumber}</p>
                <p className="text-xs text-slate-600">{item.order.user?.email || '-'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm">{item.order.status}</p>
                <p className="text-sm font-semibold">{item.order.total.toLocaleString('fr-CI')} FCFA</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
