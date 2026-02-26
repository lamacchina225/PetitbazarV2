import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProductStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function CategoryProductsPage({ params }: { params: { slug: string } }) {
  const category = await prisma.category.findUnique({ where: { slug: params.slug } });
  if (!category) notFound();

  const products = await prisma.product.findMany({
    where: { categoryId: category.id, status: ProductStatus.ACTIVE },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-4xl font-bold">{category.name}</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`} className="rounded-lg border border-slate-200 p-4 hover:shadow">
            <div className="mb-3 h-40 overflow-hidden rounded bg-slate-100">
              {p.images[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" /> : null}
            </div>
            <h2 className="font-semibold">{p.name}</h2>
            <p className="text-sm text-slate-600">{p.salePrice.toLocaleString('fr-CI')} FCFA</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

