'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'sonner';

interface AdminUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  commune: string | null;
  role: 'ADMIN' | 'GESTIONNAIRE' | 'CLIENT';
  createdAt: string;
}

export default function AdminUserPasswordPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') router.push('/');
  }, [status, session, router]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        setFeedback(null);
        const res = await fetch(`/api/admin/users/${params.id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Erreur chargement utilisateur');
        setUser(json.data?.user || null);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur chargement';
        setFeedback({ type: 'error', message });
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) loadUser();
  }, [params.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (password.length < 6) {
      const message = 'Le mot de passe doit contenir au moins 6 caracteres';
      setFeedback({ type: 'error', message });
      toast.error(message);
      return;
    }
    if (password !== confirmPassword) {
      const message = 'Les mots de passe ne correspondent pas';
      setFeedback({ type: 'error', message });
      toast.error(message);
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Mise a jour impossible');
      const message = 'Mot de passe mis a jour';
      setFeedback({ type: 'success', message });
      toast.success(message);
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur mise a jour';
      setFeedback({ type: 'error', message });
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  if (session?.user?.role !== 'ADMIN' || !user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mot de passe utilisateur</h1>
          <p className="mt-2 text-slate-600">
            {[user.firstName, user.lastName].filter(Boolean).join(' ') || '-'} ({user.role})
          </p>
        </div>
        <Link href="/admin/users" className="rounded border border-slate-300 px-4 py-2 hover:bg-slate-50">
          Retour
        </Link>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">Email: {user.email || '-'}</p>
        <p className="text-sm text-slate-600">Telephone: {user.phone || '-'}</p>
        <p className="text-sm text-slate-600">Ville: {[user.city, user.commune].filter(Boolean).join(' / ') || '-'}</p>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Changer le mot de passe</h2>
        <p className="text-sm text-slate-500">Minimum 6 caracteres.</p>
        {feedback && (
          <div
            className={`rounded border px-3 py-2 text-sm ${
              feedback.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {feedback.message}
          </div>
        )}
        <input
          type="password"
          required
          minLength={6}
          value={password}
          placeholder="Nouveau mot de passe"
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
        <input
          type="password"
          required
          minLength={6}
          value={confirmPassword}
          placeholder="Confirmer le mot de passe"
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-slate-900 px-5 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? 'Mise a jour...' : 'Mettre a jour le mot de passe'}
        </button>
      </form>
    </div>
  );
}
