'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/stores/cartStore';

type CartItemVM = {
  productId: string;
  quantity: number;
  price: number;
  product?: {
    name?: string;
    images?: string[];
  };
};

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItemVM[]>([]);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');

      if (res.status === 401) {
        setCartItems([]);
        useCartStore.getState().setCount(0);
        return;
      }

      if (!res.ok) {
        toast.error('Erreur lors du chargement du panier');
        return;
      }

      const data = await res.json();
      const itemsRaw = data.items || [];
      const items: CartItemVM[] = itemsRaw.map((ci: any) => {
        const price = ci.product?.salePrice ?? ci.product?.originalPrice ?? 0;
        return { ...ci, price };
      });

      setCartItems(items);
      useCartStore
        .getState()
        .setCount(items.reduce((sum: number, i: CartItemVM) => sum + (i.quantity || 0), 0));
    } catch (_error) {
      toast.error('Erreur lors du chargement du panier');
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    try {
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });

      if (res.ok) {
        fetchCart();
        return;
      }

      if (res.status !== 401) {
        toast.error('Erreur lors de la mise a jour');
      }
    } catch (_error) {
      toast.error('Erreur lors de la mise a jour');
    }
  };

  const removeItem = async (productId: string) => {
    try {
      const res = await fetch(`/api/cart/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCart();
        toast.success('Produit supprime du panier');
        return;
      }

      if (res.status !== 401) {
        toast.error('Erreur lors de la suppression');
      }
    } catch (_error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const total = cartItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-12">Mon panier</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-600 text-lg mb-6">Votre panier est vide</p>
          <Link
            href="/products"
            className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            Continuer les achats
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {cartItems.map((item) => (
              <div
                key={item.productId}
                className="flex gap-4 py-6 border-b border-slate-200"
              >
                <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center">
                  {item.product?.images?.[0] && (
                    <img
                      src={item.product.images[0]}
                      alt={item.product?.name || 'Produit'}
                      className="w-full h-full object-cover rounded"
                    />
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{item.product?.name}</h3>
                  <p className="text-slate-600 text-sm mb-3">
                    {item.price.toLocaleString('fr-CI', {
                      style: 'currency',
                      currency: 'XOF',
                    })}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="p-1 border border-slate-300 rounded hover:bg-slate-50"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="px-3 py-1 border border-slate-300 rounded">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="p-1 border border-slate-300 rounded hover:bg-slate-50"
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="ml-auto p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold">
                    {(item.price * item.quantity).toLocaleString('fr-CI', {
                      style: 'currency',
                      currency: 'XOF',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 p-6 rounded-lg h-fit">
            <h2 className="text-2xl font-bold mb-6">Resume</h2>

            <div className="space-y-3 mb-6 pb-6 border-b border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-600">Sous-total</span>
                <span>{total.toLocaleString('fr-CI', { style: 'currency', currency: 'XOF' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Livraison</span>
                <span>2 500 FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Taxes</span>
                <span>A calculer</span>
              </div>
            </div>

            <div className="flex justify-between mb-6">
              <span className="font-bold">Total</span>
              <span className="text-2xl font-bold">
                {(total + 2500).toLocaleString('fr-CI', {
                  style: 'currency',
                  currency: 'XOF',
                })}
              </span>
            </div>

            <Link
              href="/checkout"
              className="block w-full text-center py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold"
            >
              Proceder au paiement
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
