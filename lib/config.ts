/**
 * Configuration et constantes globales de l'application
 */

// Prix et frais
export const PRICING = {
  SHIPPING_ABIDJAN: 2500, // FCFA
  TAX_RATE: 0.18, // 18% VAT
  MIN_ORDER: 5000, // FCFA
};

// Communes d'Abidjan
export const ABIDJAN_COMMUNES = [
  'Abobo',
  'Adjamé',
  'Attécoubé',
  'Cocody',
  'Koumassi',
  'Marcory',
  'Plateau',
  'Port-Bouët',
  'Treichville',
  'Yopougon',
];

// Statuts de commande
export const ORDER_STATUSES = {
  PENDING_PAYMENT: {
    label: 'En attente de paiement',
    color: 'orange',
  },
  PAYMENT_CONFIRMED: {
    label: 'Paiement confirmé',
    color: 'blue',
  },
  ORDERED_FROM_SUPPLIER: {
    label: 'Commandé chez le fournisseur',
    color: 'blue',
  },
  IN_TRANSIT_TO_ABIDJAN: {
    label: 'En transit vers Abidjan',
    color: 'purple',
  },
  RECEIVED_IN_ABIDJAN: {
    label: 'Reçu à Abidjan',
    color: 'blue',
  },
  IN_PREPARATION: {
    label: 'En préparation',
    color: 'yellow',
  },
  IN_DELIVERY: {
    label: 'En livraison',
    color: 'lightblue',
  },
  DELIVERED: {
    label: 'Livré',
    color: 'green',
  },
  CANCELLED: {
    label: 'Annulé',
    color: 'red',
  },
  REFUNDED: {
    label: 'Remboursé',
    color: 'gray',
  },
};

// Statuts visibles par le client
export const CLIENT_VISIBLE_STATUSES = [
  'PAYMENT_CONFIRMED',
  'IN_PREPARATION',
  'IN_DELIVERY',
  'DELIVERED',
];

// Fournisseurs
export const SUPPLIERS = {
  ALIEXPRESS: { label: 'AliExpress', color: 'red' },
  SHEIN: { label: 'Shein', color: 'pink' },
  TAOBAO: { label: 'Taobao', color: 'orange' },
  TEMU: { label: 'Temu', color: 'blue' },
  DHGATE: { label: 'DHgate', color: 'green' },
};

// Methodes de paiement
export const PAYMENT_METHODS = {
  STRIPE: { label: 'Carte bancaire (Stripe)', icon: 'card' },
  CINETPAY_MOBILE: { label: 'Mobile Money (Wave/MTN/Orange)', icon: 'mobile' },
  CASH_ON_DELIVERY: { label: 'Paiement a la livraison', icon: 'cash' },
  // legacy placeholders kept for compatibility in db, not shown in UI
  CINETPAY_WAVE: { label: 'Wave (Mobile Money)', icon: 'mobile' },
  CINETPAY_ORANGE: { label: 'Orange Money', icon: 'mobile' },
  BANK_TRANSFER: { label: 'Virement bancaire', icon: 'bank' },
};

export const PAYMENT_METHOD_AVAILABILITY = {
  CINETPAY_MOBILE: process.env.NEXT_PUBLIC_ENABLE_PAYMENT_CINETPAY !== 'false',
  STRIPE: process.env.NEXT_PUBLIC_ENABLE_PAYMENT_STRIPE !== 'false',
  CASH_ON_DELIVERY: process.env.NEXT_PUBLIC_ENABLE_PAYMENT_COD !== 'false',
};

export function isPaymentMethodEnabled(method: keyof typeof PAYMENT_METHOD_AVAILABILITY): boolean {
  return PAYMENT_METHOD_AVAILABILITY[method];
}

// Délais de livraison estimés (en jours)
export const SHIPPING_TIMES = {
  SUPPLIER_TO_TRANSIT: 7, // 7 jours pour que le colis arrive en boîte de transit chinoise
  TRANSIT_TO_ABIDJAN: 10, // 10 jours de transit vers Abidjan
  ABIDJAN_DELIVERY: 3, // 3 jours pour la livraison à Abidjan
};

// Pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1,
};

// Session
export const SESSION_CONFIG = {
  MAX_AGE: 30 * 24 * 60 * 60, // 30 jours en secondes
};

// Validation
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
  PHONE_PATTERN: /^\+?[1-9]\d{1,14}$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

// Notifications
export const NOTIFICATION_TEMPLATES = {
  ORDER_CREATED: {
    subject: 'Commande reçue',
    template: 'order_created',
  },
  ORDER_CONFIRMED: {
    subject: 'Commande confirmée',
    template: 'order_confirmed',
  },
  ORDER_SHIPPED: {
    subject: 'Commande expédiée',
    template: 'order_shipped',
  },
  ORDER_DELIVERED: {
    subject: 'Colis livré',
    template: 'order_delivered',
  },
  PAYMENT_RECEIVED: {
    subject: 'Paiement reçu',
    template: 'payment_received',
  },
};

// URLs
export const URLS = {
  PAYPAL_RETURN: `${process.env.NEXTAUTH_URL}/api/payments/paypal/return`,
  PAYPAL_CANCEL: `${process.env.NEXTAUTH_URL}/api/payments/paypal/cancel`,
  STRIPE_RETURN: `${process.env.NEXTAUTH_URL}/checkout?stripe=success`,
  CINETPAY_RETURN: `${process.env.NEXTAUTH_URL}/checkout?cinetpay=success`,
};

// Images par défaut
export const DEFAULT_IMAGES = {
  PRODUCT_PLACEHOLDER: '/images/product-placeholder.png',
  USER_AVATAR: '/images/user-avatar.png',
  CATEGORY_ICON: '/images/category-placeholder.png',
};

// Analytics
export const ANALYTICS = {
  ENABLE_GA: process.env.NEXT_PUBLIC_GA_ID !== undefined,
  GA_ID: process.env.NEXT_PUBLIC_GA_ID,
};




