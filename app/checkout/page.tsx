'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ABIDJAN_COMMUNES,
  PRICING,
  PAYMENT_METHODS,
  PAYMENT_METHOD_AVAILABILITY,
} from '@/lib/config';
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

  const enabledPaymentMethods = (
    ['CINETPAY_MOBILE', 'STRIPE', 'CASH_ON_DELIVERY'] as const
  ).filter((method) => PAYMENT_METHOD_AVAILABILITY[method]);

  useEffect(() => {
    const fetchCart = async () => {
      const res = await fetch('/api/cart');
      if (!res.ok) return;
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
    };

    if (status === 'authenticated') fetchCart();
  }, [status]);

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch('/api/user/profile');
      if (!res.ok) return;
      const json = await res.json();
      const u = json.data;
      setFormData((prev) => ({
        ...prev,
        firstName: u?.firstName || prev.firstName,
        lastName: u?.lastName || prev.lastName,
        phone: u?.phone || prev.phone,
        // Livraison limitee a Abidjan: ne pas ecraser avec la ville profil
        deliveryCity: 'Abidjan',
        deliveryCommune: u?.commune || prev.deliveryCommune,
      }));
    };

    if (status === 'authenticated') fetchProfile();
  }, [status]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login?redirect=/checkout');
  }, [status, router]);

  useEffect(() => {
    if (!PAYMENT_METHOD_AVAILABILITY[formData.paymentMethod as keyof typeof PAYMENT_METHOD_AVAILABILITY]) {
      const fallback = enabledPaymentMethods[0];
      if (fallback) {
        setFormData((prev) => ({ ...prev, paymentMethod: fallback }));
      }
    }
  }, [formData.paymentMethod, enabledPaymentMethods]);

  if (status === 'loading') return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  if (!session) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.firstName || !formData.lastName || !formData.phone || !formData.deliveryAddress || !formData.deliveryCommune) {
        toast.error('Tous les champs sont obligatoires');
        return;
      }

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          deliveryPhone: formData.phone,
        }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData?.data?.id) {
        toast.error(orderData?.message || 'Erreur creation commande');
        return;
      }

      toast.success('Commande creee');

      let paymentEndpoint = '/api/payments/cinetpay/create';
      if (formData.paymentMethod === 'STRIPE') paymentEndpoint = '/api/payments/stripe/create';
      if (formData.paymentMethod === 'CASH_ON_DELIVERY') paymentEndpoint = '/api/payments/cod/confirm';

      const payRes = await fetch(paymentEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.data.id,
          amount: orderData.data.total,
          description: `Paiement commande ${orderData.data.orderNumber}`,
        }),
      });

      const payData = await payRes.json();
      if (!payRes.ok) {
        toast.error(payData?.message || 'Erreur de paiement');
        return;
      }

      if (payData?.data?.paymentUrl) {
        window.location.href = payData.data.paymentUrl;
      } else {
        router.push('/my-orders');
      }
    } catch {
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
          <p className="text-slate-600">Verifiez vos informations et procedez au paiement</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
              <div>
                <h2 className="mb-4 text-xl font-semibold text-slate-900">Informations personnelles</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Prenom"
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
                    placeholder="Telephone (+225xxxxxxxxx)"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full rounded border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

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
                    <option value="">Selectionnez une commune</option>
                    {ABIDJAN_COMMUNES.map((commune) => (
                      <option key={commune} value={commune}>
                        {commune}
                      </option>
                    ))}
                  </select>
                  <textarea
                    name="deliveryAddress"
                    placeholder="Adresse detaillee (rue, immeuble, numero, etc.)"
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    required
                    rows={3}
                    className="w-full rounded border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <h2 className="mb-4 text-xl font-semibold text-slate-900">Methode de paiement</h2>
                <div className="space-y-3">
                  {PAYMENT_METHOD_AVAILABILITY.CINETPAY_MOBILE && (
                  <label className="flex cursor-pointer items-center rounded border border-slate-300 p-4 hover:bg-slate-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CINETPAY_MOBILE"
                      checked={formData.paymentMethod === 'CINETPAY_MOBILE'}
                      onChange={handleChange}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{PAYMENT_METHODS.CINETPAY_MOBILE.label}</p>
                      <p className="text-sm text-slate-600">Paiement securise par Mobile Money</p>
                    </div>
                  </label>
                  )}

                  {PAYMENT_METHOD_AVAILABILITY.STRIPE && (
                  <label className="flex cursor-pointer items-center rounded border border-slate-300 p-4 hover:bg-slate-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="STRIPE"
                      checked={formData.paymentMethod === 'STRIPE'}
                      onChange={handleChange}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{PAYMENT_METHODS.STRIPE.label}</p>
                      <p className="text-sm text-slate-600">Paiement par carte bancaire (Visa, Mastercard...)</p>
                    </div>
                  </label>
                  )}

                  {PAYMENT_METHOD_AVAILABILITY.CASH_ON_DELIVERY && (
                  <label className="flex cursor-pointer items-center rounded border border-slate-300 p-4 hover:bg-slate-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CASH_ON_DELIVERY"
                      checked={formData.paymentMethod === 'CASH_ON_DELIVERY'}
                      onChange={handleChange}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">Paiement a la livraison</p>
                      <p className="text-sm text-slate-600">Payez en especes a la reception de votre commande.</p>
                    </div>
                  </label>
                  )}

                  {enabledPaymentMethods.length === 0 && (
                    <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      Aucune methode de paiement nest disponible pour le moment.
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || enabledPaymentMethods.length === 0}
                className="w-full rounded bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {loading
                  ? 'Traitement...'
                  : formData.paymentMethod === 'CASH_ON_DELIVERY'
                    ? 'Confirmer la commande'
                    : 'Proceder au paiement'}
              </button>
              <p className="text-center text-sm text-slate-600">
                Vous pouvez revenir au{' '}
                <Link href="/cart" className="font-semibold text-slate-900 underline">
                  panier
                </Link>
              </p>
            </form>
          </div>

          <div>
            <div className="sticky top-4 rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Resume de commande</h2>

              {cart && cart.items.length > 0 ? (
                <>
                  <div className="mb-4 space-y-2 border-b border-slate-200 pb-4">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-slate-600">
                          {item.name} x {item.quantity}
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
                    <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
                      <span>Total</span>
                      <span className="text-xl text-slate-900">{cart.total.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <p className="mb-4 text-slate-600">Votre panier est vide</p>
                  <Link href="/products" className="font-semibold text-slate-900 hover:underline">
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
