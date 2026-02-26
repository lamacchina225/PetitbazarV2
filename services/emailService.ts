import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Service d'email pour les notifications
 */
export const emailService = {
  async sendOrderConfirmation(
    email: string,
    orderNumber: string,
    _items: any[],
    total: number
  ) {
    try {
      const html = `
        <h2>Commande confirmée</h2>
        <p>Votre commande a été confirmée avec succès !</p>
        <p><strong>Numéro de commande:</strong> ${orderNumber}</p>
        <p><strong>Montant total:</strong> ${total.toLocaleString('fr-CI', {
          style: 'currency',
          currency: 'XOF',
        })}</p>
        <p>Vous pouvez suivre votre commande: <a href="https://petitbazar.ci/orders/${orderNumber}">Voir le suivi</a></p>
      `;

      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: `Commande confirmée - ${orderNumber}`,
        html,
      });

      return { success: true };
    } catch (error) {
      console.error('Email error:', error);
      return { success: false, error };
    }
  },

  async sendOrderShipped(email: string, orderNumber: string, trackingNumber?: string) {
    try {
      const html = `
        <h2>Votre commande est expédiée !</h2>
        <p>Votre commande a été expédiée et est en transit vers Abidjan.</p>
        <p><strong>Numéro de commande:</strong> ${orderNumber}</p>
        ${
          trackingNumber
            ? `<p><strong>Numéro de suivi:</strong> ${trackingNumber}</p>`
            : ''
        }
        <p>Suivez votre colis: <a href="https://petitbazar.ci/orders/${orderNumber}">Voir le suivi</a></p>
      `;

      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: `Commande expédiée - ${orderNumber}`,
        html,
      });

      return { success: true };
    } catch (error) {
      console.error('Email error:', error);
      return { success: false, error };
    }
  },

  async sendOrderDelivered(email: string, orderNumber: string) {
    try {
      const html = `
        <h2>Commande livrée !</h2>
        <p>Votre commande a été livrée avec succès !</p>
        <p><strong>Numéro de commande:</strong> ${orderNumber}</p>
        <p>Merci de votre achat chez PetitBazar !</p>
        <p>Si vous avez des questions, contactez-nous: contact@petitbazar.ci</p>
      `;

      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: `Commande livrée - ${orderNumber}`,
        html,
      });

      return { success: true };
    } catch (error) {
      console.error('Email error:', error);
      return { success: false, error };
    }
  },

  async sendPaymentReminder(email: string, orderNumber: string) {
    try {
      const html = `
        <h2>Rappel de paiement</h2>
        <p>Vous n'avez pas encore payé votre commande.</p>
        <p><strong>Numéro de commande:</strong> ${orderNumber}</p>
        <p>Veuillez compléter votre paiement: <a href="https://petitbazar.ci/checkout">Payer maintenant</a></p>
      `;

      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: `Rappel de paiement - ${orderNumber}`,
        html,
      });

      return { success: true };
    } catch (error) {
      console.error('Email error:', error);
      return { success: false, error };
    }
  },

  async sendPasswordReset(email: string, resetToken: string) {
    try {
      const html = `
        <h2>Réinitialiser votre mot de passe</h2>
        <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe:</p>
        <p><a href="https://petitbazar.ci/reset-password?token=${resetToken}">Réinitialiser le mot de passe</a></p>
        <p>Ce lien expire dans 24 heures.</p>
      `;

      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Réinitialisation du mot de passe',
        html,
      });

      return { success: true };
    } catch (error) {
      console.error('Email error:', error);
      return { success: false, error };
    }
  },

  async sendAdminNewOrder(orderNumber: string, customerName: string, total: number) {
    try {
      const adminEmail = process.env.ADMIN_EMAIL;

      if (!adminEmail) {
        return { success: false, error: 'Admin email not configured' };
      }

      const html = `
        <h2>Nouvelle commande reçue !</h2>
        <p><strong>Numéro de commande:</strong> ${orderNumber}</p>
        <p><strong>Client:</strong> ${customerName}</p>
        <p><strong>Montant:</strong> ${total.toLocaleString('fr-CI', {
          style: 'currency',
          currency: 'XOF',
        })}</p>
        <p><a href="https://petitbazar.ci/admin/orders/${orderNumber}">Voir la commande</a></p>
      `;

      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: adminEmail,
        subject: `Nouvelle commande - ${orderNumber}`,
        html,
      });

      return { success: true };
    } catch (error) {
      console.error('Email error:', error);
      return { success: false, error };
    }
  },
};

