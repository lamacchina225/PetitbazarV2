'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useCartStore } from '@/stores/cartStore';
import { animateFlyToCart } from '@/lib/cartAnimation';

type ProductProp = {
  id: string;
  name: string;
  images: string[];
  salePrice: number;
  originalPrice?: number | null;
  discount?: number | null;
  category?: { name?: string } | null;
  rating?: number | null;
};

export default function ProductCard({ product }: { product: ProductProp }) {
  const router = useRouter();
  const { status } = useSession();
  const [adding, setAdding] = useState(false);
  const imageWrapRef = useRef<HTMLDivElement | null>(null);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (status !== 'authenticated') {
      router.push('/login?redirect=/products');
      return;
    }

    setAdding(true);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.message || 'Erreur ajout panier');
        return;
      }

      useCartStore.getState().inc(1);
      animateFlyToCart({
        sourceEl: imageWrapRef.current,
        imageSrc: product.images?.[0] || null,
      });
      toast.success('Produit ajoute au panier');
    } catch (_err) {
      toast.error('Erreur reseau');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:shadow-lg">
      <Link href={`/products/${product.id}`} className="block">
        <div
          ref={imageWrapRef}
          className="relative flex h-48 items-center justify-center bg-slate-100 transition group-hover:bg-slate-200"
        >
          {product.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
          ) : null}

          {product.discount && product.discount > 0 ? (
            <span className="absolute right-2 top-2 rounded-lg bg-red-500 px-2 py-1 text-sm font-bold text-white">
              -{product.discount}%
            </span>
          ) : null}
        </div>
      </Link>

      <div className="p-4">
        <p className="mb-1 text-xs text-slate-500">{product.category?.name}</p>
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold group-hover:underline">{product.name}</h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">
              {product.salePrice.toLocaleString('fr-CI', { style: 'currency', currency: 'XOF' })}
            </p>
            {product.discount && product.discount > 0 ? (
              <p className="text-xs text-slate-500 line-through">
                {product.originalPrice?.toLocaleString('fr-CI', { style: 'currency', currency: 'XOF' })}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col items-end">
            <div className="text-center">
              <span className="text-yellow-400">?</span>
              <p className="text-xs text-slate-600">{product.rating ?? 'N/A'}</p>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="mt-3 rounded bg-slate-900 px-3 py-1 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {adding ? 'Ajout...' : 'Ajouter au panier'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
