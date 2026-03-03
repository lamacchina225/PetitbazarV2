'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Product, Category } from '@prisma/client';

interface ProductWithCategory extends Product {
  category: Category;
}

type CategoryOption = {
  id: string;
  name: string;
};

type RowEdit = {
  name: string;
  categoryId: string;
  price: string;
  stock: string;
  discount: string;
};

export default function AdminProductsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [edits, setEdits] = useState<Record<string, RowEdit>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [savingIds, setSavingIds] = useState<string[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchProducts();
  }, [page, searchTerm]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const json = await res.json();
        if (res.ok) {
          setCategories(
            (json.data?.categories || []).map((c: { id: string; name: string }) => ({
              id: c.id,
              name: c.name,
            }))
          );
        }
      } catch {
        toast.error('Erreur chargement categories');
      }
    };
    loadCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/products', window.location.origin);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', '10');
      url.searchParams.set('status', 'all');
      if (searchTerm) url.searchParams.set('search', searchTerm);

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        const fetched: ProductWithCategory[] = data.data?.products || [];
        setProducts(fetched);
        setTotal(data.data?.total || 0);
        setSelectedIds([]);

        const nextEdits: Record<string, RowEdit> = {};
        fetched.forEach((p) => {
          nextEdits[p.id] = {
            name: p.name || '',
            categoryId: p.categoryId || '',
            price: String(Math.round(p.originalPrice || 0)),
            stock: String(p.stock || 0),
            discount: String(p.discount || 0),
          };
        });
        setEdits(nextEdits);
      }
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const isAllSelected = useMemo(
    () => products.length > 0 && selectedIds.length === products.length,
    [products.length, selectedIds.length]
  );

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(products.map((p) => p.id));
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const setField = (id: string, field: keyof RowEdit, value: string) => {
    setEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const saveOne = async (id: string) => {
    const row = edits[id];
    if (!row) return false;

    const price = Number(row.price);
    const stock = Number(row.stock);
    const discount = Number(row.discount);

    if (!row.name.trim()) {
      toast.error('Nom requis');
      return false;
    }
    if (!row.categoryId) {
      toast.error('Categorie requise');
      return false;
    }
    if (!Number.isFinite(price) || price <= 0) {
      toast.error('Prix invalide');
      return false;
    }
    if (!Number.isFinite(stock) || stock < 0) {
      toast.error('Stock invalide');
      return false;
    }
    if (!Number.isFinite(discount) || discount < 0 || discount > 95) {
      toast.error('Reduction invalide (0-95)');
      return false;
    }

    const salePrice = Math.max(1, Math.round(price * (1 - discount / 100)));

    setSavingIds((prev) => [...prev, id]);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: row.name.trim(),
          categoryId: row.categoryId,
          originalPrice: price,
          stock,
          salePrice,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.message || `Erreur sauvegarde (${row.name})`);
        return false;
      }
      return true;
    } catch {
      toast.error(`Erreur reseau (${row.name})`);
      return false;
    } finally {
      setSavingIds((prev) => prev.filter((x) => x !== id));
    }
  };

  const saveSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error('Aucun article selectionne');
      return;
    }
    setBulkSaving(true);
    let ok = 0;
    for (const id of selectedIds) {
      // eslint-disable-next-line no-await-in-loop
      if (await saveOne(id)) ok += 1;
    }
    setBulkSaving(false);
    if (ok > 0) {
      toast.success(`${ok}/${selectedIds.length} article(s) mis a jour`);
      fetchProducts();
    }
  };

  const deleteOne = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) return false;
      return true;
    } catch {
      return false;
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error('Aucun article selectionne');
      return;
    }
    if (!window.confirm(`Supprimer ${selectedIds.length} article(s) selectionne(s) ?`)) return;

    setBulkDeleting(true);
    let ok = 0;
    for (const id of selectedIds) {
      // eslint-disable-next-line no-await-in-loop
      if (await deleteOne(id)) ok += 1;
    }
    setBulkDeleting(false);

    if (ok > 0) {
      toast.success(`${ok}/${selectedIds.length} article(s) supprime(s)/archive(s)`);
      fetchProducts();
      return;
    }
    toast.error('Aucune suppression effectuee');
  };

  const handleDeleteSingle = async (id: string) => {
    const ok = await deleteOne(id);
    if (ok) {
      toast.success('Article supprime/archive');
      setDeleteConfirm(null);
      fetchProducts();
      return;
    }
    toast.error('Erreur suppression');
  };

  if (status === 'loading') return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  if (session?.user?.role !== 'ADMIN') return null;

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Gestion des Produits</h1>
            <p className="mt-2 text-slate-600">Edition rapide + suppression multiple</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/imports"
              className="rounded border border-slate-300 px-4 py-3 font-semibold hover:bg-slate-50"
            >
              Importer articles
            </Link>
            <Link
              href="/admin/products/new"
              className="rounded bg-slate-900 px-6 py-3 text-white font-semibold hover:bg-slate-800"
            >
              + Nouveau produit
            </Link>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full rounded border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            onClick={saveSelected}
            disabled={selectedIds.length === 0 || bulkSaving}
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {bulkSaving ? 'Sauvegarde...' : `Enregistrer selection (${selectedIds.length})`}
          </button>
          <button
            onClick={deleteSelected}
            disabled={selectedIds.length === 0 || bulkDeleting}
            className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {bulkDeleting ? 'Suppression...' : `Supprimer selection (${selectedIds.length})`}
          </button>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          {loading ? (
            <div className="p-8 text-center text-slate-600">Chargement...</div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-slate-600">Aucun produit trouve</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Nom</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Categorie</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Prix</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Stock</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Reduction %</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {products.map((product) => {
                      const row = edits[product.id];
                      const saving = savingIds.includes(product.id);
                      return (
                        <tr key={product.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 align-top">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(product.id)}
                              onChange={() => toggleSelectRow(product.id)}
                            />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <input
                              value={row?.name || ''}
                              onChange={(e) => setField(product.id, 'name', e.target.value)}
                              className="w-56 rounded border border-slate-300 px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <select
                              value={row?.categoryId || ''}
                              onChange={(e) => setField(product.id, 'categoryId', e.target.value)}
                              className="w-40 rounded border border-slate-300 px-2 py-1 text-sm"
                            >
                              <option value="">Selectionner</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <input
                              type="number"
                              min={0}
                              value={row?.price || '0'}
                              onChange={(e) => setField(product.id, 'price', e.target.value)}
                              className="w-28 rounded border border-slate-300 px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <input
                              type="number"
                              min={0}
                              value={row?.stock || '0'}
                              onChange={(e) => setField(product.id, 'stock', e.target.value)}
                              className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <input
                              type="number"
                              min={0}
                              max={95}
                              value={row?.discount || '0'}
                              onChange={(e) => setField(product.id, 'discount', e.target.value)}
                              className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveOne(product.id)}
                                disabled={saving}
                                className="rounded bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                              >
                                {saving ? '...' : 'Sauver'}
                              </button>
                              <Link href={`/admin/products/${product.id}`} className="text-xs text-blue-600 hover:underline">
                                Detail
                              </Link>
                              <button
                                onClick={() => setDeleteConfirm(product.id)}
                                className="text-xs text-red-600 hover:underline"
                              >
                                Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-center gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="rounded px-3 py-1 disabled:opacity-50 hover:bg-slate-200"
                >
                  ← Precedent
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

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Confirmer la suppression</h3>
            <p className="mb-6 text-slate-600">Ce produit sera supprime ou archive selon son historique.</p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded border border-slate-300 px-4 py-2 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteSingle(deleteConfirm)}
                className="flex-1 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
