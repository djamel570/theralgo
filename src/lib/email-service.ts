/**
 * Email Service pour Theralgo
 *
 * Gère: Envoi d'emails, templates, emails planifiés
 * Pour l'instant: Supabase + fetch vers endpoint configurable
 * Production: Intégration avec Resend, Postmark ou SendGrid
 */

import { createServiceSupabaseClient } from './supabase-server'
import { logger } from './logger'

export interface EmailTemplate {
  to: string
  subject: string
  html: string
  from?: string
  replyTo?: string
}

interface EmailServiceConfig {
  smtpEndpoint?: string // URL du service SMTP configurable
  fromEmail?: string
  fromName?: string
}

class EmailService {
  private config: EmailServiceConfig
  private emailLogger: typeof logger

  constructor(config?: EmailServiceConfig) {
    this.config = {
      fromEmail: config?.fromEmail || process.env.NEXT_PUBLIC_FROM_EMAIL || 'noreply@theralgo.com',
      fromName: config?.fromName || 'Theralgo',
      smtpEndpoint: config?.smtpEndpoint || process.env.SMTP_ENDPOINT,
    }
    this.emailLogger = logger.child({ component: 'EmailService' })
  }

  /**
   * Envoie un email unique
   */
  async send(template: EmailTemplate): Promise<{ success: boolean; messageId?: string }> {
    try {
      this.emailLogger.debug('Envoi d\'email', { to: template.to, subject: template.subject })

      const payload = {
        to: template.to,
        from: template.from || `${this.config.fromName} <${this.config.fromEmail}>`,
        subject: template.subject,
        html: template.html,
        replyTo: template.replyTo,
      }

      // Si endpoint SMTP configuré, l'utiliser
      if (this.config.smtpEndpoint) {
        const response = await fetch(this.config.smtpEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error(`SMTP endpoint error: ${response.statusText}`)
        }

        const result = await response.json()
        this.emailLogger.debug('Email envoyé avec succès', { messageId: result.messageId })
        return { success: true, messageId: result.messageId }
      }

      // Fallback: Stocker dans Supabase pour inspection/debug
      const supabase = createServiceSupabaseClient()
      const { data, error } = await supabase.from('scheduled_emails').insert({
        to_email: template.to,
        subject: template.subject,
        html_body: template.html,
        scheduled_for: new Date().toISOString(),
        status: 'sent',
      })

      if (error) throw error

      this.emailLogger.info('Email stocké en DB (pas de SMTP)', { to: template.to })
      return { success: true, messageId: 'db-' + Date.now() }
    } catch (error) {
      this.emailLogger.error('Erreur lors de l\'envoi d\'email', error, { to: template.to })
      return { success: false }
    }
  }

  /**
   * Envoie l'email de livraison après achat
   */
  async sendProductDelivery(params: {
    buyerEmail: string
    buyerName: string
    productTitle: string
    accessUrl: string
    therapistName: string
    therapistEmail: string
  }): Promise<void> {
    const html = `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #72C15F 0%, #5DB847 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Merci!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Accédez à votre produit dès maintenant</p>
        </div>

        <div style="color: #1A1A1A; margin-bottom: 30px;">
          <p style="margin: 0 0 15px 0; font-size: 16px;">Bonjour ${params.buyerName},</p>

          <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; color: #6B7280;">
            Merci d'avoir acheté <strong>${params.productTitle}</strong> avec ${params.therapistName}!
          </p>

          <div style="background: #F7F4EE; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #72C15F;">
            <p style="margin: 0 0 15px 0; font-size: 14px; color: #6B7280;">Accédez à votre contenu:</p>
            <a href="${params.accessUrl}" style="display: inline-block; background: #72C15F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">Accéder au contenu</a>
          </div>

          <p style="margin: 0 0 15px 0; font-size: 14px; color: #6B7280;">
            Vous recevrez les modules dans votre email selon le calendrier spécifié.
          </p>

          <p style="margin: 0 0 15px 0; font-size: 14px; color: #6B7280;">
            Des questions? Contactez ${params.therapistName} à <a href="mailto:${params.therapistEmail}" style="color: #72C15F; text-decoration: none;">${params.therapistEmail}</a>
          </p>
        </div>

        <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; text-align: center; color: #9CA3AF; font-size: 12px;">
          <p style="margin: 0;">© 2026 Theralgo. Tous droits réservés.</p>
        </div>
      </div>
    `

    await this.send({
      to: params.buyerEmail,
      subject: `Accès: ${params.productTitle}`,
      html,
      replyTo: params.therapistEmail,
    })
  }

  /**
   * Envoie un email de lancement
   */
  async sendLaunchEmail(params: {
    to: string
    emailContent: { subject: string; body: string }
    therapistName: string
  }): Promise<void> {
    const html = `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #F7F4EE; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #72C15F;">
          <p style="margin: 0; font-size: 16px; color: #1A1A1A; line-height: 1.6;">
            ${params.emailContent.body.replace(/\n/g, '<br/>')}
          </p>
        </div>

        <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; text-align: center; color: #9CA3AF; font-size: 12px;">
          <p style="margin: 0;">Message de ${params.therapistName}</p>
        </div>
      </div>
    `

    await this.send({
      to: params.to,
      subject: params.emailContent.subject,
      html,
    })
  }

  /**
   * Planifie un email de drip (livraison progressive)
   */
  async scheduleDripEmail(params: {
    purchaseId: string
    email: string
    moduleTitle: string
    moduleContent: string
    deliveryDate: Date
  }): Promise<void> {
    try {
      const supabase = createServiceSupabaseClient()

      const html = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #72C15F 0%, #5DB847 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0; font-size: 24px; font-weight: 700;">Nouveau module disponible</h2>
          </div>

          <div style="color: #1A1A1A;">
            <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">${params.moduleTitle}</h3>

            <div style="background: #F7F4EE; padding: 20px; border-radius: 8px; margin: 20px 0; line-height: 1.6; color: #6B7280; font-size: 14px;">
              ${params.moduleContent.replace(/\n/g, '<br/>')}
            </div>
          </div>

          <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; text-align: center; color: #9CA3AF; font-size: 12px;">
            <p style="margin: 0;">© 2026 Theralgo</p>
          </div>
        </div>
      `

      const { error } = await supabase.from('scheduled_emails').insert({
        purchase_id: params.purchaseId,
        to_email: params.email,
        subject: `Module: ${params.moduleTitle}`,
        html_body: html,
        scheduled_for: params.deliveryDate.toISOString(),
        status: 'pending',
      })

      if (error) throw error

      this.emailLogger.info('Email de drip planifié', { email: params.email, date: params.deliveryDate })
    } catch (error) {
      this.emailLogger.error('Erreur lors de la planification du drip email', error)
      throw error
    }
  }
}

export const emailService = new EmailService()
