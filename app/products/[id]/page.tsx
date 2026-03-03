import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProductStatus } from '@prisma/client';
import ProductDetailsClient from '@/components/ProductDetailsClient';

export const dynamic = 'force-dynamic';

export default async function ProductDetailsPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findFirst({
    where: { id: params.id, status: ProductStatus.ACTIVE },
    include: { category: true },
  });

  if (!product) notFound();

  return (
    <ProductDetailsClient
      product={{
        id: product.id,
        name: product.name,
        description: product.description,
        salePrice: product.salePrice,
        images: product.images,
        sizes: product.sizes,
        variants: product.variants as any,
        categoryName: product.category.name,
        sourceUrl: product.sourceUrl,
      }}
    />
  );
}
