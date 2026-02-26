'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Shipment {
  id: string;
  shipmentNumber: string;
  quantity: number;
  totalAmount: number | null;
  createdAt: Date;
}

export default function GestionnaireShipmentsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [shipments, setShipments] = useState<Shipment[]>([]);
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
    fetchShipments();
  }, [page]);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/gestionnaire/shipments', window.location.origin);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', '10');

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        setShipments(data.data?.shipments || []);
        setTotal(data.data?.total || (data.data?.shipments || []).length || 0);
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
          <h1 className="text-4xl font-bold text-slate-900">Réception des Expéditions</h1>
          <p className="mt-2 text-slate-600">Colis arrivés en transit vers Abidjan</p>
        </div>

        {/* Table */}
        <div className="rounded-lg bg-white shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-600">Chargement...</div>
          ) : shipments.length === 0 ? (
            <div className="p-8 text-center text-slate-600">Aucune expédition trouvée</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">N° Expédition</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Quantité Colis</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Montant</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date Arrive</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {shipments.map((shipment) => (
                      <tr key={shipment.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">{shipment.shipmentNumber}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{shipment.quantity} article(s)</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{shipment.totalAmount?.toLocaleString()} FCFA</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{new Date(shipment.createdAt).toLocaleDateString('fr-CI')}</td>
                        <td className="px-6 py-4 text-sm">
                          <Link href={`/gestionnaire/shipments/${shipment.id}`} className="text-blue-600 hover:underline">
                            Confirmer Réception
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

