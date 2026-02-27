import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import authOptions from '@/lib/auth';
import { ShieldCheck, User, UserCog } from 'lucide-react';
import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') redirect('/login');

  const users = await prisma.user.findMany({
    include: {
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const roleMeta: Record<string, { label: string; className: string; icon: ReactNode }> = {
    ADMIN: {
      label: 'Admin',
      className: 'bg-red-100 text-red-700',
      icon: <ShieldCheck size={12} />,
    },
    GESTIONNAIRE: {
      label: 'Gestionnaire',
      className: 'bg-emerald-100 text-emerald-700',
      icon: <UserCog size={12} />,
    },
    CLIENT: {
      label: 'Client',
      className: 'bg-slate-100 text-slate-700',
      icon: <User size={12} />,
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Utilisateurs</h1>
          <p className="mt-2 text-slate-600">Vue globale des comptes clients, gestionnaires et admins</p>
        </div>
        <Link
          href="/admin/users/gestionnaires"
          className="rounded border border-slate-300 px-4 py-2 hover:bg-slate-50"
        >
          Gerer les gestionnaires
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Nom</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Contact</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Ville</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Commandes</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Inscription</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    {[user.firstName, user.lastName].filter(Boolean).join(' ') || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <p>{user.email || '-'}</p>
                    <p>{user.phone || '-'}</p>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold ${roleMeta[user.role]?.className || 'bg-slate-100 text-slate-700'}`}>
                      {roleMeta[user.role]?.icon}
                      {roleMeta[user.role]?.label || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {[user.city, user.commune].filter(Boolean).join(' / ') || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user._count.orders}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(user.createdAt).toLocaleDateString('fr-CI')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link href={`/admin/users/${user.id}`} className="text-blue-600 hover:underline">
                      Mot de passe
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
