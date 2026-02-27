'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';

function Bubble({ value }: { value: number }) {
  if (value <= 0) return null;
  return (
    <span className="absolute -right-4 -top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
      {value > 99 ? '99+' : value}
    </span>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [adminBubble, setAdminBubble] = useState(0);
  const [gestionBubble, setGestionBubble] = useState(0);
  const { data: session } = useSession();
  const cartCount = useCartStore((s) => s.count);
  const setCartCount = useCartStore((s) => s.setCount);

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/cart')
        .then((r) => r.json())
        .then((data) => {
          const items = data.items || [];
          setCartCount(items.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0));
        })
        .catch(() => {});
    } else {
      setCartCount(0);
    }
  }, [session, setCartCount]);

  useEffect(() => {
    let mounted = true;

    const fetchAlerts = async () => {
      if (!session?.user?.role) return;
      try {
        if (session.user.role === 'ADMIN') {
          const res = await fetch('/api/admin/alerts');
          const json = await res.json();
          if (mounted && res.ok) setAdminBubble(Number(json.data?.bubble || 0));
        }
        if (session.user.role === 'GESTIONNAIRE') {
          const res = await fetch('/api/gestionnaire/alerts');
          const json = await res.json();
          if (mounted && res.ok) setGestionBubble(Number(json.data?.bubble || 0));
        }
      } catch {
        // ignore
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 20000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [session]);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" aria-label="Accueil" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={208}
              height={57}
              className="h-[3.25rem] w-auto object-contain"
              priority
            />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="/products" className="text-sm hover:text-slate-600">
              Produits
            </Link>
            <Link href="/categories" className="text-sm hover:text-slate-600">
              Categories
            </Link>
            {session?.user?.role === 'ADMIN' && (
              <Link href="/admin" className="relative text-sm font-semibold text-blue-600">
                Admin
                <Bubble value={adminBubble} />
              </Link>
            )}
            {session?.user?.role === 'GESTIONNAIRE' && (
              <Link href="/gestionnaire" className="relative text-sm font-semibold text-green-600">
                Gestion
                <Bubble value={gestionBubble} />
              </Link>
            )}
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <Link href="/cart" id="cart-icon" data-cart-icon className="relative p-2">
              <ShoppingCart size={24} />
              <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {cartCount}
              </span>
            </Link>

            {session ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {(session.user?.name && session.user.name.split(' ')[0]) || session.user?.email}
                  </p>
                  <span className="text-xs text-slate-500">{session.user?.role}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100"
                >
                  Deconnexion
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" className="rounded px-3 py-2 text-sm hover:bg-slate-100">
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
                >
                  S'inscrire
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <Link href="/cart" id="cart-icon-mobile" data-cart-icon className="relative p-2">
              <ShoppingCart size={22} />
              <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {cartCount}
              </span>
            </Link>
            <button className="p-2" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="border-t border-slate-200 pb-4 md:hidden">
            <Link href="/products" className="block py-2 text-sm">
              Produits
            </Link>
            <Link href="/categories" className="block py-2 text-sm">
              Categories
            </Link>
            {session?.user?.role === 'ADMIN' && (
              <Link href="/admin" className="block py-2 text-sm font-semibold text-blue-600">
                Admin {adminBubble > 0 ? `(${adminBubble > 99 ? '99+' : adminBubble})` : ''}
              </Link>
            )}
            {session?.user?.role === 'GESTIONNAIRE' && (
              <Link href="/gestionnaire" className="block py-2 text-sm font-semibold text-green-600">
                Gestion {gestionBubble > 0 ? `(${gestionBubble > 99 ? '99+' : gestionBubble})` : ''}
              </Link>
            )}
            {!session ? (
              <>
                <Link href="/login" className="block py-2 text-sm">
                  Connexion
                </Link>
                <Link href="/register" className="block py-2 text-sm">
                  S'inscrire
                </Link>
              </>
            ) : (
              <button onClick={() => signOut()} className="block w-full py-2 text-left text-sm">
                Deconnexion
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
