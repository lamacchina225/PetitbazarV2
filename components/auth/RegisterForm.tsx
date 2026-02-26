 'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import toast from 'react-hot-toast';

export default function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: '',
    commune: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          city: formData.city,
          commune: formData.commune,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Erreur lors de l\'inscription');
        return;
      }

      toast.success('Inscription réussie ! Connexion en cours...');

      // Auto login using credentials provider
      try {
        const login = formData.email || formData.phone;
        const result = await signIn('credentials', {
          redirect: false,
          login,
          password: formData.password,
        } as any);

        if (result && (result as any).error) {
          toast.error('Connexion automatique impossible. Veuillez vous connecter manuellement.');
          router.push('/login');
        } else {
          router.push('/');
        }
      } catch (e) {
        router.push('/login');
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold mb-1">Prénom</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Jean"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Nom</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Dupont"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="jean@email.com"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">Téléphone</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+225 01 23 45 67 89"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold mb-1">Ville</label>
          <select
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
            required
          >
            <option value="">Sélectionner</option>
            <option value="Abidjan">Abidjan</option>
            <option value="Yamoussoukro">Yamoussoukro</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Commune</label>
          <input
            type="text"
            name="commune"
            value={formData.commune}
            onChange={handleChange}
            placeholder="ex: Plateau"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">Mot de passe</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">Confirmer le mot de passe</label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="••••••••"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 font-semibold text-sm"
      >
        {isLoading ? 'Inscription en cours...' : 'S\'inscrire'}
      </button>

      <p className="text-center text-xs text-slate-600">
        Vous avez déjà un compte ? {' '}
        <Link href="/login" className="font-semibold hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}

