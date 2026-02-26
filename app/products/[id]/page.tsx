import Link from 'next/link';
import AddToCartButton from '@/components/AddToCartButton';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProductStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function ProductDetailsPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findFirst({
    where: { id: params.id, status: ProductStatus.ACTIVE },
    include: { category: true, reviews: true },
  });

  if (!product) notFound();

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div className="rounded-lg bg-slate-100 p-4">
        {product.images[0] ? <img src={product.images[0]} alt={product.name} className="h-[420px] w-full rounded object-cover" /> : null}
      </div>
      <div>
        <p className="mb-2 text-sm text-slate-500">{product.category.name}</p>
        <h1 className="mb-4 text-4xl font-bold">{product.name}</h1>
        <p className="mb-6 text-slate-700">{product.description}</p>
        <p className="mb-6 text-3xl font-bold">{product.salePrice.toLocaleString('fr-CI')} FCFA</p>
        <div className="flex items-center gap-3">
          <AddToCartButton productId={product.id} imageSrc={product.images[0] || undefined} />
          <Link href="/cart" className="inline-block rounded border border-slate-300 px-4 py-2 hover:bg-slate-50">
            Aller au panier
          </Link>
        </div>
      </div>
    </div>
  );
}
