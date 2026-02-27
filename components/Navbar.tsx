'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const cartCount = useCartStore((s) => s.count);
  const setCartCount = useCartStore((s) => s.setCount);

  useEffect(() => {
    // fetch count when session available
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

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
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

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/products" className="text-sm hover:text-slate-600">
              Produits
            </Link>
            <Link href="/categories" className="text-sm hover:text-slate-600">
              Catégories
            </Link>
            {session?.user?.role === 'ADMIN' && (
              <Link href="/admin" className="text-sm font-semibold text-blue-600">
                Admin
              </Link>
            )}
            {session?.user?.role === 'GESTIONNAIRE' && (
              <Link href="/gestionnaire" className="text-sm font-semibold text-green-600">
                Gestion
              </Link>
            )}
          </div>

          {/* Right Section */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/cart" id="cart-icon" data-cart-icon className="relative p-2">
              <ShoppingCart size={24} />
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            </Link>

            {session ? (
              <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold">{(session.user?.name && session.user.name.split(' ')[0]) || session.user?.email}</p>
                      <span className="text-xs text-slate-500">{session.user?.role}</span>
                    </div>
                <button
                  onClick={() => signOut()}
                  className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-100"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  className="px-3 py-2 text-sm hover:bg-slate-100 rounded"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-2 text-sm bg-slate-900 text-white rounded hover:bg-slate-800"
                >
                  S'inscrire
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-1">
            <Link href="/cart" id="cart-icon-mobile" data-cart-icon className="relative p-2">
              <ShoppingCart size={22} />
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            </Link>
            <button
              className="p-2"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-slate-200">
            <Link href="/products" className="block py-2 text-sm">
              Produits
            </Link>
            <Link href="/categories" className="block py-2 text-sm">
              Catégories
            </Link>
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
              <button
                onClick={() => signOut()}
                className="block w-full text-left py-2 text-sm"
              >
                Déconnexion
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

