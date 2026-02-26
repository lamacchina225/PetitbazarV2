'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    originalPrice: '',
    salePrice: '',
    stock: '',
    discount: '',
    categoryId: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();
      if (res.ok) {
        setFormData({
          name: data.data.name || '',
          description: data.data.description || '',
          originalPrice: data.data.originalPrice?.toString() || '',
          salePrice: data.data.salePrice?.toString() || '',
          stock: data.data.stock?.toString() || '',
          discount: data.data.discount?.toString() || '',
          categoryId: data.data.categoryId || '',
        });
      }
    } catch (error) {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          originalPrice: parseFloat(formData.originalPrice),
          salePrice: parseFloat(formData.salePrice),
          stock: parseInt(formData.stock),
          discount: parseInt(formData.discount),
        }),
      });

      if (res.ok) {
        toast.success('Produit mis à jour');
        router.push('/admin/products');
      } else {
        toast.error('Erreur mise à jour');
      }
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  if (session?.user?.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Modifier Produit</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Nom</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full rounded border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full rounded border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Prix Original (FCFA)</label>
              <input
                type="number"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                className="w-full rounded border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Prix Détail (FCFA)</label>
              <input
                type="number"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                className="w-full rounded border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Stock</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full rounded border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Réduction (%)</label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                min="0"
                max="100"
                className="w-full rounded border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded bg-slate-900 px-6 py-3 text-white font-semibold disabled:opacity-50 hover:bg-slate-800"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 rounded border border-slate-300 px-6 py-3 font-semibold hover:bg-slate-50"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
