'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'sonner';

type Shipment = {
  id: string;
  status: string;
  carrier: string | null;
  trackingNumber: string | null;
  createdAt: string;
  orders: Array<{ orderId: string }>;
};

export default function AdminShipmentsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') router.push('/');
  }, [status, session, router]);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/shipments');
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Erreur chargement');
        setShipments(json.data?.shipments || []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erreur chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchShipments();
  }, []);

  if (status === 'loading' || loading) return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  if (session?.user?.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Expeditions vers Abidjan</h1>
            <p className="mt-2 text-slate-600">Suivi des colis groupes envoyes par l admin</p>
          </div>
          <Link href="/admin/shipments/new" className="rounded bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800">
            + Nouvelle expedition
          </Link>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          {shipments.length === 0 ? (
            <div className="p-8 text-center text-slate-600">Aucune expedition</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Reference</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Statut</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Transporteur</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Commandes</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {shipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-semibold">{shipment.trackingNumber || shipment.id.slice(-8).toUpperCase()}</td>
                      <td className="px-6 py-4 text-sm">{shipment.status}</td>
                      <td className="px-6 py-4 text-sm">{shipment.carrier || '-'}</td>
                      <td className="px-6 py-4 text-sm">{shipment.orders?.length || 0}</td>
                      <td className="px-6 py-4 text-sm">{new Date(shipment.createdAt).toLocaleDateString('fr-CI')}</td>
                      <td className="px-6 py-4 text-sm">
                        <Link href={`/admin/shipments/${shipment.id}`} className="text-blue-600 hover:underline">
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
