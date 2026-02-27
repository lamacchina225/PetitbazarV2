'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    originalPrice: '',
    salePrice: '',
    cost: '',
    stock: '0',
    sku: '',
    sourcePlatform: 'OTHER',
    sourceUrl: '',
    sourceProductId: '',
    categoryId: '',
    featured: false,
    imageUrl: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') router.push('/');
  }, [status, session, router]);

  useEffect(() => {
    const loadCategories = async () => {
      const res = await fetch('/api/categories');
      const json = await res.json();
      if (res.ok) {
        setCategories(json.data?.categories || []);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (!form.slug && form.name) {
      setForm((p) => ({
        ...p,
        slug: p.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-'),
      }));
    }
  }, [form.name, form.slug]);

  const images = useMemo(
    () => (form.imageUrl.trim() ? [form.imageUrl.trim()] : []),
    [form.imageUrl]
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId) {
      toast.error('Selectionnez une categorie');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          images,
          originalPrice: Number(form.originalPrice || 0),
          salePrice: Number(form.salePrice || 0),
          cost: Number(form.cost || 0),
          stock: Number(form.stock || 0),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Creation impossible');
      toast.success('Produit cree');
      router.push('/admin/products');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur creation');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  if (session?.user?.role !== 'ADMIN') return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-4xl font-bold text-slate-900">Nouveau produit</h1>

      <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            required
            placeholder="Nom du produit"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="rounded border border-slate-300 px-3 py-2"
          />
          <input
            required
            placeholder="Slug"
            value={form.slug}
            onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            className="rounded border border-slate-300 px-3 py-2"
          />
        </div>

        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          rows={4}
          className="w-full rounded border border-slate-300 px-3 py-2"
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <input
            required
            type="number"
            placeholder="Prix original"
            value={form.originalPrice}
            onChange={(e) => setForm((p) => ({ ...p, originalPrice: e.target.value }))}
            className="rounded border border-slate-300 px-3 py-2"
          />
          <input
            required
            type="number"
            placeholder="Prix de vente"
            value={form.salePrice}
            onChange={(e) => setForm((p) => ({ ...p, salePrice: e.target.value }))}
            className="rounded border border-slate-300 px-3 py-2"
          />
          <input
            required
            type="number"
            placeholder="Cout"
            value={form.cost}
            onChange={(e) => setForm((p) => ({ ...p, cost: e.target.value }))}
            className="rounded border border-slate-300 px-3 py-2"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            required
            placeholder="SKU"
            value={form.sku}
            onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
            className="rounded border border-slate-300 px-3 py-2"
          />
          <input
            type="number"
            placeholder="Stock"
            value={form.stock}
            onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
            className="rounded border border-slate-300 px-3 py-2"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <select
            required
            value={form.categoryId}
            onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
            className="rounded border border-slate-300 px-3 py-2"
          >
            <option value="">Selectionner une categorie</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={form.sourcePlatform}
            onChange={(e) => setForm((p) => ({ ...p, sourcePlatform: e.target.value }))}
            className="rounded border border-slate-300 px-3 py-2"
          >
            <option value="OTHER">Autre</option>
            <option value="ALIEXPRESS">AliExpress</option>
            <option value="SHEIN">Shein</option>
            <option value="TAOBAO">Taobao</option>
            <option value="TEMU">Temu</option>
            <option value="DHGATE">DHgate</option>
          </select>
        </div>

        <input
          required
          placeholder="URL source produit"
          value={form.sourceUrl}
          onChange={(e) => setForm((p) => ({ ...p, sourceUrl: e.target.value }))}
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
        <input
          required
          placeholder="ID source produit"
          value={form.sourceProductId}
          onChange={(e) => setForm((p) => ({ ...p, sourceProductId: e.target.value }))}
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
        <input
          placeholder="URL image principale (optionnel)"
          value={form.imageUrl}
          onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
          className="w-full rounded border border-slate-300 px-3 py-2"
        />

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
          />
          Mettre en avant ce produit
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-slate-900 px-5 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'Creation...' : 'Creer le produit'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="rounded border border-slate-300 px-5 py-2 hover:bg-slate-50"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
