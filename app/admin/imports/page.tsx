'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import Link from 'next/link';

type Category = {
  id: string;
  name: string;
  slug: string;
};

type ImportJob = {
  id: string;
  platform: string;
  query: string | null;
  status: string;
  createdAt: string;
  metadata?: { itemCount?: number; source?: string } | null;
  raws?: Array<{ id: string }>;
};

const PLATFORM_OPTIONS = ['ALL', 'ALIEXPRESS', 'SHEIN', 'TAOBAO', 'TEMU', 'DHGATE'] as const;

export default function AdminImportsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [submitting, setSubmitting] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [form, setForm] = useState({
    platform: 'ALL',
    query: '',
    categoryId: '',
    maxItems: '20',
    autoNormalize: true,
    realOnly: false,
    sourceUrls: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') router.push('/');
  }, [status, session, router]);

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const json = await res.json();
      if (res.ok) setCategories(json.data?.categories || []);
    } catch {
      toast.error('Erreur chargement categories');
    }
  };

  const loadJobs = async () => {
    try {
      setLoadingJobs(true);
      const res = await fetch('/api/admin/imports/jobs?limit=20');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Erreur chargement jobs');
      setJobs(json.data?.jobs || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur jobs');
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadJobs();
  }, []);

  const canSubmit = useMemo(
    () =>
      (form.query.trim().length > 0 || form.sourceUrls.trim().length > 0) &&
      Number.isFinite(Number(form.maxItems)) &&
      Number(form.maxItems) > 0,
    [form]
  );

  const submitImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/imports/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: form.platform,
          query: form.query.trim(),
          categoryId: form.categoryId || undefined,
          maxItems: Number(form.maxItems),
          autoNormalize: form.autoNormalize,
          realOnly: form.realOnly,
          sourceUrls: form.sourceUrls
            .split('\n')
            .map((x) => x.trim())
            .filter(Boolean),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || 'Import impossible');

      const summary = json.data?.summary;
      if (summary) {
        const itemCount = Number(summary.itemCount || 0);
        const createdCount = Number(summary.createdCount || 0);
        const updatedCount = Number(summary.updatedCount || 0);
        if (itemCount <= 0 || createdCount + updatedCount <= 0) {
          toast.warning(
            `Import termine mais aucun produit visible: ${itemCount} trouves, ${createdCount} crees, ${updatedCount} maj`
          );
        } else {
          toast.success(`Import OK: ${itemCount} trouves, ${createdCount} crees, ${updatedCount} maj`);
        }
      } else {
        toast.success(json.message || 'Import termine');
      }
      await loadJobs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur import');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  if (session?.user?.role !== 'ADMIN') return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Import d'articles fournisseurs</h1>
          <p className="mt-1 text-sm text-slate-600">
            Lance des imports AliExpress/Shein/Taobao/Temu/DHGate puis normalise vers le catalogue.
          </p>
        </div>
        <Link
          href="/admin/products"
          className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
        >
          Retour produits
        </Link>
      </div>

      <form onSubmit={submitImport} className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-800">Plateforme</label>
            <select
              value={form.platform}
              onChange={(e) => setForm((prev) => ({ ...prev, platform: e.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2"
            >
              {PLATFORM_OPTIONS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-800">Recherche</label>
            <input
              value={form.query}
              onChange={(e) => setForm((prev) => ({ ...prev, query: e.target.value }))}
              placeholder="Ex: montre femme, écouteurs bluetooth..."
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="mb-1 block text-sm font-semibold text-slate-800">
              URLs produits source (optionnel, 1 par ligne)
            </label>
            <textarea
              rows={4}
              value={form.sourceUrls}
              onChange={(e) => setForm((prev) => ({ ...prev, sourceUrls: e.target.value }))}
              placeholder="https://www.aliexpress.com/item/....&#10;https://fr.shein.com/...."
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-800">Categorie cible (optionnel)</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2"
            >
              <option value="">Auto-detection</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-800">Nombre max d'articles</label>
            <input
              type="number"
              min={1}
              max={100}
              value={form.maxItems}
              onChange={(e) => setForm((prev) => ({ ...prev, maxItems: e.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>
          <label className="mt-6 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.autoNormalize}
              onChange={(e) => setForm((prev) => ({ ...prev, autoNormalize: e.target.checked }))}
            />
            Creer/mettre a jour automatiquement les produits
          </label>
          <label className="mt-6 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.realOnly}
              onChange={(e) => setForm((prev) => ({ ...prev, realOnly: e.target.checked }))}
            />
            Exiger des donnees reelles (pas de fallback)
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="rounded bg-slate-900 px-5 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? 'Import en cours...' : 'Lancer import'}
          </button>
          <button
            type="button"
            onClick={loadJobs}
            className="rounded border border-slate-300 px-5 py-2 hover:bg-slate-50"
          >
            Rafraichir jobs
          </button>
        </div>
        {!canSubmit && (
          <p className="mt-2 text-xs text-slate-500">
            Renseigne une recherche ou des URLs source et un nombre d'articles supérieur à 0 pour activer l'import.
          </p>
        )}
      </form>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Historique imports</h2>
        </div>
        {loadingJobs ? (
          <div className="px-6 py-10 text-sm text-slate-600">Chargement...</div>
        ) : jobs.length === 0 ? (
          <div className="px-6 py-10 text-sm text-slate-600">Aucun job d'import pour le moment.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-700">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Plateforme</th>
                  <th className="px-6 py-3">Requete</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Source</th>
                  <th className="px-6 py-3">Bruts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="px-6 py-3 text-slate-600">
                      {new Date(job.createdAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900">{job.platform}</td>
                    <td className="px-6 py-3 text-slate-700">{job.query || '-'}</td>
                    <td className="px-6 py-3">{job.status}</td>
                    <td className="px-6 py-3 text-slate-600">{job.metadata?.source || '-'}</td>
                    <td className="px-6 py-3 text-slate-600">
                      {job.metadata?.itemCount ?? job.raws?.length ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
