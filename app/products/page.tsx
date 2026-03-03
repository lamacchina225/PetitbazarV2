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

  const [products, categoryRows, categoryCounts] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany({
      orderBy: [{ featured: 'desc' }, { name: 'asc' }],
    }),
    prisma.product.groupBy({
      by: ['categoryId'],
      where: { status: ProductStatus.ACTIVE },
      _count: { _all: true },
    }),
  ]);

  const categoryCountById = new Map(categoryCounts.map((row) => [row.categoryId, row._count._all]));
  const categories = categoryRows.filter((c) => (categoryCountById.get(c.id) || 0) > 0 || c.slug === category);

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
        <form action="/products" method="GET" className="mb-8 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="text"
              name="search"
              placeholder="Rechercher un produit..."
              defaultValue={search}
              className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {category ? <input type="hidden" name="category" value={category} /> : null}
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-6 py-2 text-white hover:bg-slate-800 sm:w-auto"
          >
            Rechercher
          </button>
        </form>

        {/* Categories Filter */}
        <div className="flex items-start gap-4 overflow-x-auto px-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.name, cat.slug);
            const isActive = category === cat.slug;
            const label = displayCategoryName(cat.name, cat.slug);
            const count = categoryCountById.get(cat.id) || 0;
            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
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
                <span className="text-[10px] text-slate-400">{count}</span>
              </Link>
            );
          })}

          <Link
            href={`/products${search ? `?search=${encodeURIComponent(search)}` : ''}`}
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
        {categories.length === 0 && (
          <p className="mt-3 text-sm text-slate-500">
            Aucune categorie visible pour le moment. Importe des articles ou cree des categories depuis l'admin.
          </p>
        )}
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


