'use client';

import { useMemo, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

const WHATSAPP_NUMBER = '225779622084';
const DEFAULT_MESSAGE = 'Bonjour, j ai une question sur PetitBazar.';

export default function WhatsAppBotBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');

  const whatsappUrl = useMemo(() => {
    const text = question.trim() ? `Bonjour, j ai une question: ${question.trim()}` : DEFAULT_MESSAGE;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  }, [question]);

  return (
    <div className="fixed bottom-5 right-5 z-[70]">
      {isOpen && (
        <div className="mb-3 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Bot WhatsApp</p>
            <button
              type="button"
              aria-label="Fermer le chat"
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <X size={16} />
            </button>
          </div>

          <p className="mb-3 text-xs text-slate-600">
            Posez votre question, puis envoyez-la sur WhatsApp.
          </p>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            placeholder="Ex: Quel est le delai de livraison?"
            className="mb-3 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-0 focus:border-green-500"
          />

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="block w-full rounded-lg bg-green-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-green-700"
          >
            Envoyer sur WhatsApp
          </a>
        </div>
      )}

      <button
        type="button"
        aria-label="Ouvrir le bot WhatsApp"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition hover:scale-105 hover:bg-green-700"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
}
