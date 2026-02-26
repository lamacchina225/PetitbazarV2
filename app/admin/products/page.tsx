'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Product, Category } from '@prisma/client';

interface ProductWithCategory extends Product {
  category: Category;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [status, session, router]);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, [page, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/products', window.location.origin);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', '10');
      if (searchTerm) url.searchParams.set('search', searchTerm);

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        setProducts(data.data?.products || []);
        setTotal(data.data?.total || 0);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!deleteConfirm) return;

    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Produit supprimé');
        setDeleteConfirm(null);
        fetchProducts();
      } else {
        toast.error('Erreur suppression');
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  if (status === 'loading') return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  if (session?.user?.role !== 'ADMIN') return null;

  const itemsPerPage = 10;
  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Gestion des Produits</h1>
            <p className="mt-2 text-slate-600">Créez, modifiez ou supprimez des produits</p>
          </div>
          <Link
            href="/admin/products/new"
            className="rounded bg-slate-900 px-6 py-3 text-white font-semibold hover:bg-slate-800"
          >
            + Nouveau produit
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
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

        {/* Table */}
        <div className="rounded-lg bg-white shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-600">Chargement...</div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-slate-600">Aucun produit trouvé</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Nom</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Catégorie</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Prix</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Stock</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Réduction</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm text-slate-900 font-medium">{product.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{product.category?.name || '-'}</td>
                        <td className="px-6 py-4 text-sm text-slate-900 font-medium">{product.originalPrice?.toLocaleString()} FCFA</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{product.stock || 0}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{product.discount || 0}%</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <Link
                              href={`/admin/products/${product.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              Modifier
                            </Link>
                            <button
                              onClick={() => setDeleteConfirm(product.id)}
                              className="text-red-600 hover:underline"
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
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

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="rounded-lg bg-white p-6 shadow-lg max-w-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Confirmer la suppression</h3>
            <p className="text-slate-600 mb-6">Ce produit sera supprimé définitivement.</p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded border border-slate-300 px-4 py-2 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
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

