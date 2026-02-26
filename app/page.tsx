import ProductsPage from '@/app/products/page';

export const dynamic = 'force-dynamic';

interface HomePageProps {
  searchParams: {
    search?: string;
    category?: string;
  };
}

export default function HomePage({ searchParams }: HomePageProps) {
  return <ProductsPage searchParams={searchParams} />;
}

