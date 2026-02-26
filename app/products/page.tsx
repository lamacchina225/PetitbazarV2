import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { Search } from 'lucide-react';
import { Prisma, ProductStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface ProductsPageProps {
  searchParams: {
    search?: string;
    category?: string;
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const search = searchParams.search || '';
  const category = searchParams.category || '';
  const where: Prisma.ProductWhereInput = {
    status: ProductStatus.ACTIVE,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(category ? { category: { slug: category } } : {}),
  };

  // Fetch products based on search/category
  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
    },
    take: 50,
  });

  const categories = await prisma.category.findMany({
    where: { featured: true },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-8">Tous les produits</h1>

        {/* Search Bar */}
        <div className="mb-8 flex flex-col gap-2 sm:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              defaultValue={search}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <button className="w-full rounded-lg bg-slate-900 px-6 py-2 text-white hover:bg-slate-800 sm:w-auto">
            Rechercher
          </button>
        </div>

        {/* Categories Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4">
          <Link
            href="/products"
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              !category
                ? 'bg-slate-900 text-white'
                : 'border border-slate-300 hover:bg-slate-50'
            }`}
          >
            Tous
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                category === cat.slug
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-300 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-slate-600 text-lg mb-4">Aucun produit trouvé</p>
          <Link
            href="/products"
            className="text-slate-900 font-semibold hover:underline"
          >
            Voir tous les produits
          </Link>
        </div>
      )}
    </div>
  );
}



