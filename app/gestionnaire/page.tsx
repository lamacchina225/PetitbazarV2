import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import authOptions from '@/lib/auth';
import { Package, Truck, CheckCircle } from 'lucide-react';
import { OrderStatus, ShipmentStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function GestionnaireDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'GESTIONNAIRE') {
    redirect('/login');
  }

  // Fetch dashboard stats
  const [totalShipments, toReceive, delivered, inPreparation, inDelivery] = await Promise.all([
    prisma.shipmentToAbidjan.count(),
    prisma.shipmentToAbidjan.count({ where: { status: ShipmentStatus.SENT_TO_ABIDJAN } }),
    prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
    prisma.order.count({ where: { status: OrderStatus.IN_PREPARATION } }),
    prisma.order.count({ where: { status: OrderStatus.IN_DELIVERY } }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Tableau de bord Gestionnaire</h1>
        <p className="text-slate-600">Gestion des colis et des livraisons à Abidjan</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Envois totaux</p>
              <p className="text-3xl font-bold mt-2">{totalShipments}</p>
            </div>
            <Package className="text-slate-400" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">À recevoir</p>
              <p className="text-3xl font-bold mt-2">{toReceive}</p>
            </div>
            <Truck className="text-orange-400" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Livrés</p>
              <p className="text-3xl font-bold mt-2">{delivered}</p>
            </div>
            <CheckCircle className="text-green-400" size={32} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Colis en transit</h2>
          <p className="text-slate-600 mb-6">Gérer les colis en route vers Abidjan</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/gestionnaire/shipments"
              className="relative w-full rounded bg-slate-900 px-4 py-2 text-center text-white hover:bg-slate-800 sm:w-auto"
            >
              Voir les colis
              {toReceive > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                  {toReceive > 99 ? '99+' : toReceive}
                </span>
              )}
            </Link>
            <Link
              href="/gestionnaire/shipments"
              className="w-full rounded border border-slate-300 px-4 py-2 text-center hover:bg-slate-50 sm:w-auto"
            >
              Mettre à jour le statut
            </Link>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Commandes à livrer</h2>
          <p className="text-slate-600 mb-6">Voir les commandes en attente de livraison</p>
          <Link
            href="/gestionnaire/orders"
            className="relative inline-block w-full rounded bg-slate-900 px-4 py-2 text-center text-white hover:bg-slate-800 sm:w-auto"
          >
            Voir les commandes
            {(inPreparation + inDelivery) > 0 && (
              <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                {(inPreparation + inDelivery) > 99 ? '99+' : (inPreparation + inDelivery)}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Recent Shipments */}
      <div className="mt-12 bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold">Derniers envois</h2>
        </div>
        <div className="p-6">
          <p className="text-slate-600 text-center py-8">Aucun envoi récent</p>
        </div>
      </div>
    </div>
  );
}


