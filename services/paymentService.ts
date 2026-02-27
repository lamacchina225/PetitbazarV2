import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

/**
 * Service Stripe pour les paiements par carte bancaire
 */
export const stripeService = {
  async createPaymentIntent(
    amount: number,
    currency: string = 'eur',
    metadata?: Record<string, any>
  ) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Stripe error:', error);
      return {
        success: false,
        error: 'Failed to create payment intent',
      };
    }
  },

  async retrievePaymentIntent(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        success: true,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
      };
    } catch (error) {
      console.error('Stripe error:', error);
      return {
        success: false,
        error: 'Failed to retrieve payment intent',
      };
    }
  },

  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string
  ) {
    try {
      const paymentIntent = await stripe.paymentIntents.confirm(
        paymentIntentId,
        {
          payment_method: paymentMethodId,
        }
      );

      return {
        success: true,
        status: paymentIntent.status,
      };
    } catch (error) {
      console.error('Stripe confirmation error:', error);
      return {
        success: false,
        error: 'Payment confirmation failed',
      };
    }
  },
};

/**
 * Service Cinetpay pour les paiements Mobile Money
 */
export const cinetpayService = {
  async createPayment(
    orderId: string,
    amount: number,
    currency: string = 'XOF',
    description?: string
  ) {
    try {
      const apiKey = process.env.CINETPAY_API_KEY;
      const siteId = process.env.CINETPAY_SITE_ID;
      const apiUrl = process.env.NEXT_PUBLIC_CINETPAY_ENDPOINT;

      if (!apiKey || !siteId || !apiUrl) {
        return {
          success: false,
          error: 'Cinetpay credentials not configured',
        };
      }

      const response = await fetch(`${apiUrl}/v1/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apikey: apiKey,
          site_id: siteId,
          amount: Math.round(amount),
          currency,
          transaction_id: orderId,
          description: description || `Order ${orderId}`,
          return_url: `${process.env.NEXTAUTH_URL}/api/cinetpay/callback`,
          notify_url: `${process.env.NEXTAUTH_URL}/api/webhooks/cinetpay`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Payment creation failed',
        };
      }

      return {
        success: true,
        paymentUrl: data.data?.payment_url,
        transactionId: data.data?.transaction_id,
      };
    } catch (error) {
      console.error('Cinetpay error:', error);
      return {
        success: false,
        error: 'Payment creation failed',
      };
    }
  },

  async checkPaymentStatus(transactionId: string) {
    try {
      const apiKey = process.env.CINETPAY_API_KEY;
      const siteId = process.env.CINETPAY_SITE_ID;
      const apiUrl = process.env.NEXT_PUBLIC_CINETPAY_ENDPOINT;

      if (!apiKey || !siteId || !apiUrl) {
        return {
          success: false,
          error: 'Cinetpay credentials not configured',
        };
      }

      const response = await fetch(
        `${apiUrl}/v1/payment/check?apikey=${apiKey}&site_id=${siteId}&transaction_id=${transactionId}`,
        {
          method: 'GET',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Status check failed',
        };
      }

      return {
        success: true,
        status: data.data?.status,
        amount: data.data?.amount,
        currency: data.data?.currency,
      };
    } catch (error) {
      console.error('Cinetpay error:', error);
      return {
        success: false,
        error: 'Status check failed',
      };
    }
  },
};

/**
 * Service générique pour les notifications de paiement
 */
export const paymentNotificationService = {
  async notifyPaymentSuccess(orderId: string, amount: number) {
    // À implémenter - envoyer notification par email/SMS
    console.log(`Payment successful for order ${orderId}, amount: ${amount}`);
  },

  async notifyPaymentFailure(orderId: string, reason: string) {
    // À implémenter - envoyer notification par email/SMS
    console.log(`Payment failed for order ${orderId}, reason: ${reason}`);
  },
};
