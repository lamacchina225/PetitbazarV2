'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ABIDJAN_COMMUNES, PRICING, PAYMENT_METHODS } from '@/lib/config';
import { toast } from 'sonner';

interface CartSummary {
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  subtotal: number;
  total: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    deliveryCity: 'Abidjan',
    deliveryCommune: '',
    deliveryAddress: '',
    paymentMethod: 'CINETPAY_MOBILE',
  });

  // Fetch cart data
  useEffect(() => {
    const fetchCart = async () => {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const json = await res.json();
        const itemsRaw = json.items || [];
        const items = itemsRaw.map((ci: any) => ({
          id: ci.productId || ci.id,
          name: ci.product?.name || ci.productName || '',
          price: ci.product?.salePrice ?? ci.product?.originalPrice ?? 0,
          quantity: ci.quantity || 1,
        }));
        const subtotal = items.reduce((s: number, it: any) => s + it.price * it.quantity, 0);
        const total = subtotal + PRICING.SHIPPING_ABIDJAN;
        setCart({ items, subtotal, total });
      }
    };
    if (status === 'authenticated') fetchCart();
  }, [status]);

  // Fetch user profile and prefill checkout form
  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const json = await res.json();
        const u = json.data;
        setFormData((prev) => ({
          ...prev,
          firstName: u?.firstName || prev.firstName,
          lastName: u?.lastName || prev.lastName,
          phone: u?.phone || prev.phone,
          deliveryCity: u?.city || prev.deliveryCity,
          deliveryCommune: u?.commune || prev.deliveryCommune,
        }));
      }
    };
    if (status === 'authenticated') fetchProfile();
  }, [status]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/checkout');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }

  if (!session) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!formData.firstName || !formData.lastName || !formData.phone || !formData.deliveryAddress || !formData.deliveryCommune) {
        toast.error('Tous les champs sont obligatoires');
        setLoading(false);
        return;
      }

      // Create order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData?.data?.id) {
        toast.error(orderData?.message || 'Erreur création commande');
        setLoading(false);
        return;
      }

      toast.success('Commande créée');

      // Create payment
      const payRes = await fetch('/api/payments/cinetpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.data.id,
          amount: orderData.data.total,
          description: `Paiement commande ${orderData.data.orderNumber}`,
        }),
      });

      const payData = await payRes.json();
      if (payData?.data?.paymentUrl) {
        window.location.href = payData.data.paymentUrl;
      } else {
        router.push(`/my-orders`);
      }
    } catch (error) {
      toast.error('Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-slate-900">Finaliser votre commande</h1>
          <p className="text-slate-600">Vérifiez vos informations et procédez au paiement</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
              {/* Personal Info */}
              <div>
                <h2 className="mb-4 text-xl font-semibold text-slate-900">Informations personnelles</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Prénom"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="rounded border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Nom"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="rounded border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div className="mt-4">
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Téléphone (+225xxxxxxxxx)"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full rounded border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Delivery Info */}
              <div>
                <h2 className="mb-4 text-xl font-semibold text-slate-900">Adresse de livraison</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    name="deliveryCity"
                    value={formData.deliveryCity}
                    disabled
                    className="w-full rounded border border-slate-300 bg-slate-100 px-4 py-2 text-slate-600"
                  />
                  <select
                    name="deliveryCommune"
                    value={formData.deliveryCommune}
                    onChange={handleChange}
                    required
                    className="w-full rounded border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">Sélectionnez une commune</option>
                    {ABIDJAN_COMMUNES.map((commune) => (
                      <option key={commune} value={commune}>
                        {commune}
                      </option>
                    ))}
                  </select>
                  <textarea
                    name="deliveryAddress"
                    placeholder="Adresse détaillée (rue, immeuble, numéro, etc.)"
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    required
                    rows={3}
                    className="w-full rounded border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h2 className="mb-4 text-xl font-semibold text-slate-900">Méthode de paiement</h2>
                <div className="space-y-3">
                  <label className="flex items-center rounded border border-slate-300 p-4 cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CINETPAY_MOBILE"
                      checked={formData.paymentMethod === 'CINETPAY_MOBILE'}
                      onChange={handleChange}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {PAYMENT_METHODS.CINETPAY_MOBILE.label}
                      </p>
                      <p className="text-sm text-slate-600">
                        Paiement sécurisé par Mobile Money
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-slate-900 py-3 text-white font-semibold disabled:opacity-50 hover:bg-slate-800"
              >
                {loading ? 'Traitement...' : 'Procéder au paiement'}
              </button>
              <p className="text-center text-sm text-slate-600">
                Vous pouvez revenir au{' '}
                <Link href="/cart" className="text-slate-900 underline font-semibold">
                  panier
                </Link>
              </p>
            </form>
          </div>

          {/* Summary */}
          <div>
            <div className="sticky top-4 rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Résumé de commande</h2>

              {cart && cart.items.length > 0 ? (
                <>
                  <div className="mb-4 space-y-2 border-b border-slate-200 pb-4">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-slate-600">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="font-medium text-slate-900">{(item.price * item.quantity).toLocaleString()} FCFA</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Sous-total</span>
                      <span className="text-slate-900">{cart.subtotal.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Livraison</span>
                      <span className="text-slate-900">{PRICING.SHIPPING_ABIDJAN.toLocaleString()} FCFA</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 font-semibold flex justify-between">
                      <span>Total</span>
                      <span className="text-xl text-slate-900">{cart.total.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-slate-600 mb-4">Votre panier est vide</p>
                  <Link href="/products" className="text-slate-900 font-semibold hover:underline">
                    Continuer vos achats
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
