'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import Link from 'next/link';
import { ShieldCheck, UserCog } from 'lucide-react';

interface Gestionnaire {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  commune: string | null;
  role: 'ADMIN' | 'GESTIONNAIRE';
  createdAt: string;
}

export default function GestionnairesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [list, setList] = useState<Gestionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: 'Abidjan',
    commune: '',
    role: 'GESTIONNAIRE',
    password: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') router.push('/');
  }, [status, session, router]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/gestionnaires');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Erreur chargement');
      setList(json.data?.gestionnaires || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      load();
    }
  }, [status, session]);

  const createGestionnaire = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/admin/gestionnaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Creation impossible');
      toast.success('Gestionnaire cree');
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        city: 'Abidjan',
        commune: '',
        role: 'GESTIONNAIRE',
        password: '',
      });
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur creation');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  if (session?.user?.role !== 'ADMIN') return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Equipe interne</h1>
        <p className="mt-2 text-slate-600">Creer et administrer les comptes admin et gestionnaire</p>
      </div>

      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Nouveau compte interne</h2>
        <form onSubmit={createGestionnaire} className="grid gap-4 sm:grid-cols-2">
          <input
            required
            placeholder="Prenom"
            value={form.firstName}
            onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
            className="rounded border border-slate-300 px-3 py-2"
          />
          <input
            required
            placeholder="Nom"
            value={form.lastName}
            onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
            className="rounded border border-slate-300 px-3 py-2"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="rounded border border-slate-300 px-3 py-2"
          />
          <input
            placeholder="Telephone"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className="rounded border border-slate-300 px-3 py-2"
          />
          <input
            placeholder="Ville"
            value={form.city}
            onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
            className="rounded border border-slate-300 px-3 py-2"
          />
          <input
            placeholder="Commune"
            value={form.commune}
            onChange={(e) => setForm((p) => ({ ...p, commune: e.target.value }))}
            className="rounded border border-slate-300 px-3 py-2"
          />
          <select
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as 'ADMIN' | 'GESTIONNAIRE' }))}
            className="rounded border border-slate-300 px-3 py-2 sm:col-span-2"
          >
            <option value="GESTIONNAIRE">Gestionnaire</option>
            <option value="ADMIN">Admin</option>
          </select>
          <input
            required
            type="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            className="rounded border border-slate-300 px-3 py-2 sm:col-span-2"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50 sm:col-span-2"
          >
            {saving ? 'Creation...' : 'Creer le compte'}
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Nom</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Telephone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Localisation</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Creation</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {list.map((g) => (
                <tr key={g.id}>
                  <td className="px-6 py-4 text-sm">{[g.firstName, g.lastName].filter(Boolean).join(' ') || '-'}</td>
                  <td className="px-6 py-4 text-sm">{g.email || '-'}</td>
                  <td className="px-6 py-4 text-sm">{g.phone || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    {g.role === 'ADMIN' ? (
                      <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                        <ShieldCheck size={12} />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                        <UserCog size={12} />
                        Gestionnaire
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">{[g.city, g.commune].filter(Boolean).join(' / ') || '-'}</td>
                  <td className="px-6 py-4 text-sm">{new Date(g.createdAt).toLocaleDateString('fr-CI')}</td>
                  <td className="px-6 py-4 text-sm">
                    <Link href={`/admin/users/${g.id}`} className="text-blue-600 hover:underline">
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
