import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ProductStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const [categories, counts] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ featured: 'desc' }, { name: 'asc' }],
    }),
    prisma.product.groupBy({
      by: ['categoryId'],
      where: { status: ProductStatus.ACTIVE },
      _count: { _all: true },
    }),
  ]);
  const countByCategory = new Map(counts.map((row) => [row.categoryId, row._count._all]));
  const visibleCategories = categories.filter((category) => (countByCategory.get(category.id) || 0) > 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-4xl font-bold">Categories</h1>
      {visibleCategories.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-sm text-slate-600">
          Aucune categorie avec produit actif. Lance un import depuis l'admin pour alimenter le catalogue.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCategories.map((c) => (
            <Link key={c.id} href={`/categories/${c.slug}`} className="rounded-lg border border-slate-200 p-6 hover:shadow">
              <h2 className="text-xl font-semibold">{c.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{countByCategory.get(c.id) || 0} produits</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
