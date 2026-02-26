'use client';

import { useRef, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { useCartStore } from '@/stores/cartStore';
import { animateFlyToCart } from '@/lib/cartAnimation';

export default function AddToCartButton({
  productId,
  imageSrc,
}: {
  productId: string;
  imageSrc?: string;
}) {
  const { status } = useSession();
  const [adding, setAdding] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const handleAdd = async () => {
    if (status === 'unauthenticated') {
      signIn(undefined, { callbackUrl: '/login?redirect=/products' });
      return;
    }

    setAdding(true);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast.error(err?.message || 'Erreur lors de l ajout');
        return;
      }

      useCartStore.getState().inc(1);
      animateFlyToCart({ sourceEl: btnRef.current, imageSrc: imageSrc || null, size: 56 });
      toast.success('Produit ajoute au panier');
    } catch (_e) {
      toast.error('Erreur lors de l ajout');
    } finally {
      setAdding(false);
    }
  };

  return (
    <button
      ref={btnRef}
      onClick={handleAdd}
      disabled={adding}
      className="rounded bg-slate-900 px-6 py-3 text-white hover:bg-slate-800 disabled:opacity-60"
    >
      {adding ? 'Ajout...' : 'Ajouter au panier'}
    </button>
  );
}
