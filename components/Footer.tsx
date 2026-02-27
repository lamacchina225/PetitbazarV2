import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="font-bold mb-4">À propos de PetitBazar</h3>
            <p className="text-sm text-slate-300">
              Votre plateforme de shopping en ligne pour les meilleurs produits tendance,
              avec livraison à Abidjan.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-bold mb-4">Navigation</h3>
            <ul className="text-sm space-y-2">
              <li><Link href="/products" className="hover:text-brand-300">Produits</Link></li>
              <li><Link href="/categories" className="hover:text-brand-300">Catégories</Link></li>
              <li><Link href="/about" className="hover:text-brand-300">À propos</Link></li>
              <li><Link href="/contact" className="hover:text-brand-300">Contact</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="font-bold mb-4">Aide</h3>
            <ul className="text-sm space-y-2">
              <li><Link href="/faq" className="hover:text-brand-300">FAQ</Link></li>
              <li><Link href="/shipping" className="hover:text-brand-300">Expédition</Link></li>
              <li><Link href="/returns" className="hover:text-brand-300">Retours</Link></li>
              <li><Link href="/support" className="hover:text-brand-300">Support</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold mb-4">Légal</h3>
            <ul className="text-sm space-y-2">
              <li><Link href="/privacy" className="hover:text-brand-300">Confidentialité</Link></li>
              <li><Link href="/terms" className="hover:text-brand-300">CGU</Link></li>
              <li><Link href="/cookies" className="hover:text-brand-300">Cookies</Link></li>
            </ul>
          </div>
        </div>

        {/* Social & Contact */}
        <div className="border-t border-slate-700 pt-8">
          <div className="mb-4 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-bold mb-3">Suivez-nous</h3>
              <div className="flex flex-wrap gap-4">
                <a href="https://tiktok.com" className="text-slate-300 hover:text-white">TikTok</a>
                <a href="https://instagram.com" className="text-slate-300 hover:text-white">Instagram</a>
                <a href="https://facebook.com" className="text-slate-300 hover:text-white">Facebook</a>
                <a href="https://wa.me/225779622084" target="_blank" rel="noreferrer" className="text-slate-300 hover:text-white">WhatsApp</a>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-2">Contactez-nous</h3>
              <p className="text-sm text-slate-300">📞 07 79 62 20 84</p>
              <p className="text-sm text-slate-300">📧 contact@petitbazar.ci</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-6 text-center text-sm text-slate-400">
          <p>&copy; 2024 PetitBazar. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}

