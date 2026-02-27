import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import {
  Search,
  Grid2x2,
  Package,
  Smartphone,
  Shirt,
  Sparkles,
  Tags,
  type LucideIcon,
} from 'lucide-react';
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

  const getCategoryIcon = (name: string, slug: string): LucideIcon => {
    const value = `${name} ${slug}`.toLowerCase();
    if (value.includes('accessoire') || value.includes('maison') || value.includes('home')) return Package;
    if (value.includes('electro') || value.includes('electron')) return Smartphone;
    if (value.includes('mode') || value.includes('vetement') || value.includes('fashion')) return Shirt;
    if (value.includes('beaute') || value.includes('beauty')) return Sparkles;
    return Tags;
  };

  const displayCategoryName = (name: string, slug: string): string => {
    const value = `${name} ${slug}`.toLowerCase();
    if (value.includes('maison') || value.includes('accessoire')) return 'Accessoires';
    return name;
  };

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
        <div className="flex items-start gap-4 overflow-x-auto px-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.name, cat.slug);
            const isActive = category === cat.slug;
            const label = displayCategoryName(cat.name, cat.slug);
            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                title={label}
                aria-label={label}
                className="flex w-16 shrink-0 flex-col items-center gap-2"
              >
                <span
                  className={`inline-grid h-12 w-12 place-items-center rounded-xl leading-none transition ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={19} strokeWidth={1.9} />
                </span>
                <span className={`line-clamp-2 text-center text-xs font-medium ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                  {label}
                </span>
              </Link>
            );
          })}

          <Link
            href="/products"
            title="Tous"
            aria-label="Tous"
            className="flex w-14 shrink-0 flex-col items-center gap-2"
          >
            <span
              className={`inline-grid h-12 w-12 place-items-center rounded-xl leading-none transition ${
                !category
                  ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Grid2x2 size={19} strokeWidth={1.9} />
            </span>
            <span className={`text-center text-xs font-medium ${!category ? 'text-slate-900' : 'text-slate-600'}`}>
              Tous
            </span>
          </Link>
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



