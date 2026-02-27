import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import authOptions from '@/lib/auth';
import { BarChart3, Users, Package, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/login');
  }

  // Fetch dashboard stats
  const [totalOrders, totalRevenue, totalUsers, pendingOrders, newPaidOrders, toShip] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: 'DELIVERED' },
    }),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.order.count({ where: { status: 'PENDING_PAYMENT' } }),
    prisma.order.count({ where: { status: 'PAYMENT_CONFIRMED' } }),
    prisma.order.count({ where: { status: 'ORDERED_FROM_SUPPLIER' } }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Tableau de bord Admin</h1>
        <p className="text-slate-600">Bienvenue {session.user?.email}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Commandes totales</p>
              <p className="text-3xl font-bold mt-2">{totalOrders}</p>
            </div>
            <Package className="text-slate-400" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Revenus</p>
              <p className="text-3xl font-bold mt-2">
                {(totalRevenue._sum.total || 0).toLocaleString('fr-CI', {
                  style: 'currency',
                  currency: 'XOF',
                })}
              </p>
            </div>
            <TrendingUp className="text-slate-400" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Clients</p>
              <p className="text-3xl font-bold mt-2">{totalUsers}</p>
            </div>
            <Users className="text-slate-400" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Commandes en attente</p>
              <p className="text-3xl font-bold mt-2">{pendingOrders}</p>
            </div>
            <BarChart3 className="text-slate-400" size={32} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Gestion des produits</h2>
          <p className="text-slate-600 mb-6">Ajouter, modifier ou supprimer des produits</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/admin/products"
              className="w-full rounded bg-slate-900 px-4 py-2 text-center text-white hover:bg-slate-800 sm:w-auto"
            >
              Voir tous les produits
            </Link>
            <Link
              href="/admin/products/new"
              className="w-full rounded border border-slate-300 px-4 py-2 text-center hover:bg-slate-50 sm:w-auto"
            >
              Ajouter un produit
            </Link>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Gestion des commandes</h2>
          <p className="text-slate-600 mb-6">Traiter et suivre les commandes</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/admin/orders"
              className="relative w-full rounded bg-slate-900 px-4 py-2 text-center text-white hover:bg-slate-800 sm:w-auto"
            >
              Voir les commandes
              {newPaidOrders > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                  {newPaidOrders > 99 ? '99+' : newPaidOrders}
                </span>
              )}
            </Link>
            <Link
              href="/admin/orders?status=PAYMENT_CONFIRMED"
              className="w-full rounded border border-red-300 px-4 py-2 text-center text-red-600 hover:bg-red-50 sm:w-auto"
            >
              Nouvelles commandes payees
            </Link>
            <Link
              href="/admin/orders?status=ORDERED_FROM_SUPPLIER"
              className="relative w-full rounded border border-slate-300 px-4 py-2 text-center hover:bg-slate-50 sm:w-auto"
            >
              A expedier
              {toShip > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-900 px-1 text-[11px] font-bold text-white">
                  {toShip > 99 ? '99+' : toShip}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Gestion des utilisateurs</h2>
          <p className="text-slate-600 mb-6">Gérer les rôles et les comptes</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/admin/users"
              className="w-full rounded bg-slate-900 px-4 py-2 text-center text-white hover:bg-slate-800 sm:w-auto"
            >
              Voir les utilisateurs
            </Link>
            <Link
              href="/admin/users/gestionnaires"
              className="w-full rounded border border-slate-300 px-4 py-2 text-center hover:bg-slate-50 sm:w-auto"
            >
              Créer un gestionnaire
            </Link>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Expéditions</h2>
          <p className="text-slate-600 mb-6">Gérer les envois vers Abidjan</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/admin/shipments"
              className="w-full rounded bg-slate-900 px-4 py-2 text-center text-white hover:bg-slate-800 sm:w-auto"
            >
              Voir les expéditions
            </Link>
            <Link
              href="/admin/shipments/new"
              className="w-full rounded border border-slate-300 px-4 py-2 text-center hover:bg-slate-50 sm:w-auto"
            >
              Créer une expédition
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


