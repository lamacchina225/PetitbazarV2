/**
 * Utilitaires et fonctions communes
 */

import { VALIDATION } from '@/lib/config';

/**
 * Formate une date en texte lisible
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-CI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Formate une date avec l'heure
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('fr-CI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Formate un prix
 */
export function formatPrice(price: number, currency: string = 'XOF'): string {
  return new Intl.NumberFormat('fr-CI', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Formate un numéro téléphone
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `+225 ${match[1]} ${match[2]} ${match[3]}`;
  }
  return phone;
}

/**
 * Valide une adresse email
 */
export function validateEmail(email: string): boolean {
  return VALIDATION.EMAIL_PATTERN.test(email);
}

/**
 * Valide un numéro de téléphone
 */
export function validatePhone(phone: string): boolean {
  // Supprime les espaces et caractères spéciaux
  const cleaned = phone.replace(/\D/g, '');
  // Côte d'Ivoire: +225 et 8-9 chiffres
  return /^2257\d{7,8}$|^07\d{7,8}$|^012\d{7,8}$/.test(cleaned);
}

/**
 * Valide un mot de passe
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
    errors.push(
      `Le mot de passe doit contenir au moins ${VALIDATION.MIN_PASSWORD_LENGTH} caractères`
    );
  }

  if (password.length > VALIDATION.MAX_PASSWORD_LENGTH) {
    errors.push(
      `Le mot de passe ne doit pas dépasser ${VALIDATION.MAX_PASSWORD_LENGTH} caractères`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Génère un slug depuis une chaîne de caractères
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àâä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o')
    .replace(/[ûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Obtient les initiales d'un nom
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
}

/**
 * Tronque un texte à une longueur donnée
 */
export function truncate(text: string, length: number = 100): string {
  if (text.length <= length) return text;
  return `${text.substring(0, length)}...`;
}

/**
 * Génère un ID unique
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calcule le prix final avec taxes
 */
export function calculateTotal(
  subtotal: number,
  shipping: number = 0,
  taxRate: number = 0.18
): number {
  const tax = (subtotal + shipping) * taxRate;
  return subtotal + shipping + tax;
}

/**
 * Calcule la réduction en pourcentage
 */
export function calculateDiscount(original: number, sale: number): number {
  if (original === 0) return 0;
  return Math.round(((original - sale) / original) * 100);
}

/**
 * Groupes des items par propriété
 */
export function groupBy<T>(
  array: T[],
  key: keyof T
): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const group = String(item[key]);
      if (!result[group]) {
        result[group] = [];
      }
      result[group].push(item);
      return result;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Obtient la différence entre deux dates en jours
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Ajoute des jours à une date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Obtient le début de la journée
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Obtient la fin de la journée
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Clone un objet profondément
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Fusionne des objets
 */
export function mergeObjects<T extends Record<string, any>>(
  target: T,
  source: Partial<T>
): T {
  return { ...target, ...source };
}

/**
 * Vérifie si un objet est vide
 */
export function isEmpty(obj: Record<string, any>): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Obtient une chaîne de requête URL
 */
export function getQueryString(params: Record<string, any>): string {
  return new URLSearchParams(
    Object.entries(params).map(([key, value]) => [
      key,
      String(value),
    ])
  ).toString();
}

/**
 * Parse une chaîne de requête URL
 */
export function parseQueryString(qs: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(qs));
}

/**
 * Obtient la valeur d'un cookie
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

/**
 * Définit un cookie
 */
export function setCookie(
  name: string,
  value: string,
  options: { maxAge?: number; path?: string } = {}
) {
  if (typeof document === 'undefined') return;
  let cookieString = `${name}=${value}`;
  if (options.maxAge) {
    cookieString += `; max-age=${options.maxAge}`;
  }
  if (options.path) {
    cookieString += `; path=${options.path}`;
  }
  document.cookie = cookieString;
}

/**
 * Supprime un cookie
 */
export function deleteCookie(name: string) {
  setCookie(name, '', { maxAge: -1 });
}
