'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface ReferralLandingProps {
  referralLink: {
    id: string
    therapistName: string
    therapistSpecialty: string
    therapistCity: string
    therapistPhoto?: string
    therapistApproach?: string
    referrerName: string
    referrerMessage?: string
    therapistMessage?: string
    linkType: 'booking' | 'product' | 'both'
    product?: {
      id: string
      title: string
      description: string
      price: number
      type: string
      slug: string
    }
    rewardForReferrer?: string
  }
  slug: string
}

interface BookingFormData {
  name: string
  email: string
  phone: string
  preferredDate: string
  preferredTime: string
  message: string
}

interface FormErrors {
  [key: string]: string
}

const ReferralLanding: React.FC<ReferralLandingProps> = ({ referralLink, slug }) => {
  const [bookingForm, setBookingForm] = useState<BookingFormData>({
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    preferredTime: '',
    message: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const faqItems = [
    {
      question: 'Comment se passe une première séance ?',
      answer:
        'La première séance est un moment d\'échange et de connaissance mutuelle. Votre thérapeute prendra le temps de comprendre votre situation, vos objectifs et vos préoccupations. C\'est aussi l\'occasion pour vous de poser toutes vos questions et de vous sentir à l\'aise avant de poursuivre.',
    },
    {
      question: 'Est-ce que tout est confidentiel ?',
      answer:
        'Oui, absolument. Le secret professionnel est un pilier fondamental de la thérapie. Tout ce que vous partagez avec votre thérapeute reste confidentiel et sécurisé, sauf dans les rares cas prévus par la loi.',
    },
    {
      question: 'Combien coûte une séance ?',
      answer:
        'Le tarif des séances varie selon le thérapeute et son expérience. Vous pouvez discuter des tarifs directement lors de votre prise de rendez-vous. De nombreux thérapeutes proposent également des forfaits ou des réductions pour un suivi régulier.',
    },
    {
      question: 'Je ne sais pas si j\'ai besoin d\'un thérapeute',
      answer:
        'C\'est une question que beaucoup se posent. Si vous ressentez du stress, de l\'anxiété, de la tristesse ou simplement le besoin de parler avec quelqu\'un d\'impartial, une thérapie peut vraiment vous aider. Une première consultation n\'engage à rien et vous permettra de voir si c\'est fait pour vous.',
    },
  ]

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!bookingForm.name.trim()) {
      newErrors.name = 'Le nom est requis'
    }

    if (!bookingForm.email.trim()) {
      newErrors.email = 'L\'email est requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingForm.email)) {
      newErrors.email = 'Email invalide'
    }

    if (!bookingForm.phone.trim()) {
      newErrors.phone = 'Le téléphone est requis'
    }

    if (!bookingForm.preferredDate) {
      newErrors.preferredDate = 'Veuillez sélectionner une date'
    }

    if (!bookingForm.preferredTime) {
      newErrors.preferredTime = 'Veuillez sélectionner une heure'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/referral/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralSlug: slug,
          formData: bookingForm,
          type: 'booking',
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la soumission')
      }

      setSubmitSuccess(true)
      setBookingForm({ name: '', email: '', phone: '', preferredDate: '', preferredTime: '', message: '' })

      setTimeout(() => {
        setSubmitSuccess(false)
      }, 5000)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setBookingForm((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const initials = referralLink.therapistName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const containerStyle: React.CSSProperties = {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    color: '#1A1A1A',
    backgroundColor: '#F7F4EE',
    minHeight: '100vh',
  }

  const trustBannerStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    padding: '20px',
    textAlign: 'center',
    borderBottom: '1px solid #E5E7EB',
    marginBottom: '40px',
  }

  const trustBannerTextStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 500,
    color: '#1A1A1A',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  }

  const trustBannerQuoteStyle: React.CSSProperties = {
    fontSize: '16px',
    fontStyle: 'italic',
    color: '#6B7280',
    maxWidth: '600px',
    margin: '0 auto',
  }

  const mainContentStyle: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '0 20px 60px',
  }

  const therapistCardStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '40px',
    marginBottom: '40px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  }

  const therapistPhotoStyle: React.CSSProperties = {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: '#72C15F',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    fontSize: '48px',
    fontWeight: 700,
    color: '#FFFFFF',
  }

  const therapistHeaderStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '20px',
  }

  const therapistNameStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '8px',
  }

  const therapistInfoStyle: React.CSSProperties = {
    fontSize: '16px',
    color: '#6B7280',
    marginBottom: '4px',
  }

  const trustIndicatorStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #E5E7EB',
    fontSize: '14px',
    color: '#72C15F',
    fontWeight: 500,
  }

  const therapistApproachStyle: React.CSSProperties = {
    backgroundColor: '#F7F4EE',
    padding: '16px',
    borderRadius: '12px',
    marginTop: '20px',
    fontSize: '14px',
    color: '#6B7280',
    lineHeight: '1.6',
  }

  const sectionHeadingStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '24px',
    color: '#1A1A1A',
  }

  const bookingFormStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '40px',
    marginBottom: '40px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  }

  const formGroupStyle: React.CSSProperties = {
    marginBottom: '20px',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '8px',
    color: '#1A1A1A',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  const inputErrorStyle: React.CSSProperties = {
    ...inputStyle,
    borderColor: '#EF4444',
  }

  const errorMessageStyle: React.CSSProperties = {
    color: '#EF4444',
    fontSize: '12px',
    marginTop: '4px',
  }

  const formGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '20px',
  }

  const referrerTagStyle: React.CSSProperties = {
    display: 'inline-block',
    backgroundColor: '#F0F9EC',
    color: '#72C15F',
    padding: '8px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '24px',
  }

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 24px',
    backgroundColor: '#72C15F',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '9999px',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  }

  const buttonHoverStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#5DB847',
  }

  const badgeStyle: React.CSSProperties = {
    display: 'inline-block',
    backgroundColor: '#F0F9EC',
    color: '#72C15F',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    marginTop: '16px',
  }

  const productCardStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '40px',
    marginBottom: '40px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  }

  const productTitleStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 700,
    marginBottom: '12px',
  }

  const productPriceStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    color: '#72C15F',
    marginBottom: '16px',
  }

  const productDescriptionStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6B7280',
    lineHeight: '1.6',
    marginBottom: '20px',
  }

  const benefitListStyle: React.CSSProperties = {
    listStyle: 'none',
    padding: 0,
    marginBottom: '24px',
  }

  const benefitItemStyle: React.CSSProperties = {
    padding: '12px 0',
    fontSize: '14px',
    color: '#1A1A1A',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  }

  const socialProofStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '40px',
    marginBottom: '40px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  }

  const proofGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
    marginTop: '24px',
  }

  const proofItemStyle: React.CSSProperties = {
    textAlign: 'center',
  }

  const proofIconStyle: React.CSSProperties = {
    fontSize: '32px',
    marginBottom: '12px',
  }

  const proofTitleStyle: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 600,
    marginBottom: '8px',
    color: '#1A1A1A',
  }

  const proofDescriptionStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#6B7280',
    lineHeight: '1.5',
  }

  const faqStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '40px',
    marginBottom: '40px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  }

  const faqItemStyle: React.CSSProperties = {
    borderBottom: '1px solid #E5E7EB',
    paddingBottom: '20px',
    marginBottom: '20px',
  }

  const faqItemLastStyle: React.CSSProperties = {
    ...faqItemStyle,
    borderBottom: 'none',
    marginBottom: 0,
    paddingBottom: 0,
  }

  const faqQuestionStyle: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1A1A1A',
    cursor: 'pointer',
    padding: '12px 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    userSelect: 'none',
  }

  const faqAnswerStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6B7280',
    lineHeight: '1.6',
    marginTop: '12px',
    paddingLeft: '0px',
  }

  const footerStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    padding: '40px 20px',
    textAlign: 'center',
    borderTop: '1px solid #E5E7EB',
    marginTop: '60px',
  }

  const footerBadgeStyle: React.CSSProperties = {
    display: 'inline-block',
    backgroundColor: '#F0F9EC',
    color: '#72C15F',
    padding: '12px 24px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '16px',
  }

  const footerTextStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#6B7280',
  }

  const successMessageStyle: React.CSSProperties = {
    backgroundColor: '#D1FAE5',
    border: '1px solid #6EE7B7',
    color: '#065F46',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: 500,
  }

  const errorMessageBoxStyle: React.CSSProperties = {
    backgroundColor: '#FEE2E2',
    border: '1px solid #FECACA',
    color: '#991B1B',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: 500,
  }

  return (
    <div style={containerStyle}>
      {/* Trust Banner */}
      <div style={trustBannerStyle}>
        <div style={trustBannerTextStyle}>
          <span>❤️</span>
          <span>Recommandé par {referralLink.referrerName}</span>
        </div>
        {referralLink.referrerMessage && (
          <p style={trustBannerQuoteStyle}>"{referralLink.referrerMessage}"</p>
        )}
      </div>

      <div style={mainContentStyle}>
        {/* Therapist Profile Card */}
        <div style={therapistCardStyle}>
          {referralLink.therapistPhoto ? (
            <Image
              src={referralLink.therapistPhoto}
              alt={referralLink.therapistName}
              width={120}
              height={120}
              style={{ ...therapistPhotoStyle, position: 'relative', objectFit: 'cover' }}
            />
          ) : (
            <div style={therapistPhotoStyle}>{initials}</div>
          )}

          <div style={therapistHeaderStyle}>
            <h1 style={therapistNameStyle}>{referralLink.therapistName}</h1>
            <p style={therapistInfoStyle}>{referralLink.therapistSpecialty}</p>
            <p style={therapistInfoStyle}>{referralLink.therapistCity}</p>
          </div>

          <div style={trustIndicatorStyle}>
            <span>✓</span>
            <span>Recommandé par un patient • 8 ans d'expérience</span>
          </div>

          {referralLink.therapistApproach && (
            <div style={therapistApproachStyle}>{referralLink.therapistApproach}</div>
          )}
        </div>

        {/* Booking Section */}
        {(referralLink.linkType === 'booking' || referralLink.linkType === 'both') && (
          <div style={bookingFormStyle}>
            <h2 style={sectionHeadingStyle}>Prenez rendez-vous</h2>

            {submitSuccess && (
              <div style={successMessageStyle}>
                Merci ! Votre demande a été envoyée. {referralLink.therapistName} vous contactera bientôt.
              </div>
            )}

            {submitError && (
              <div style={errorMessageBoxStyle}>
                {submitError}
              </div>
            )}

            <div style={referrerTagStyle}>J'ai été recommandé(e) par {referralLink.referrerName}</div>

            <form onSubmit={handleBookingSubmit}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Votre nom</label>
                <input
                  type="text"
                  name="name"
                  value={bookingForm.name}
                  onChange={handleInputChange}
                  style={errors.name ? inputErrorStyle : inputStyle}
                  placeholder="Jean Dupont"
                />
                {errors.name && <div style={errorMessageStyle}>{errors.name}</div>}
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={bookingForm.email}
                  onChange={handleInputChange}
                  style={errors.email ? inputErrorStyle : inputStyle}
                  placeholder="jean@example.com"
                />
                {errors.email && <div style={errorMessageStyle}>{errors.email}</div>}
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  value={bookingForm.phone}
                  onChange={handleInputChange}
                  style={errors.phone ? inputErrorStyle : inputStyle}
                  placeholder="+33 6 12 34 56 78"
                />
                {errors.phone && <div style={errorMessageStyle}>{errors.phone}</div>}
              </div>

              <div style={formGridStyle}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Date préférée</label>
                  <input
                    type="date"
                    name="preferredDate"
                    value={bookingForm.preferredDate}
                    onChange={handleInputChange}
                    style={errors.preferredDate ? inputErrorStyle : inputStyle}
                  />
                  {errors.preferredDate && (
                    <div style={errorMessageStyle}>{errors.preferredDate}</div>
                  )}
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>Heure préférée</label>
                  <input
                    type="time"
                    name="preferredTime"
                    value={bookingForm.preferredTime}
                    onChange={handleInputChange}
                    style={errors.preferredTime ? inputErrorStyle : inputStyle}
                  />
                  {errors.preferredTime && (
                    <div style={errorMessageStyle}>{errors.preferredTime}</div>
                  )}
                </div>
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Message (optionnel)</label>
                <textarea
                  name="message"
                  value={bookingForm.message}
                  onChange={handleInputChange}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    minHeight: '100px',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                  placeholder="Parlez-nous un peu de votre situation..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#5DB847'
                  }
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#72C15F'
                }}
                style={{
                  ...buttonStyle,
                  opacity: isSubmitting ? 0.7 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? 'Envoi en cours...' : 'Réserver mon créneau'}
              </button>

              <div style={badgeStyle}>🎁 Première consultation de 30 min offerte</div>
            </form>
          </div>
        )}

        {/* Product Section */}
        {(referralLink.linkType === 'product' || referralLink.linkType === 'both') &&
          referralLink.product && (
            <div style={productCardStyle}>
              <h2 style={sectionHeadingStyle}>Découvrez le programme</h2>

              <h3 style={productTitleStyle}>{referralLink.product.title}</h3>
              <p style={productPriceStyle}>{referralLink.product.price}€</p>

              <p style={productDescriptionStyle}>{referralLink.product.description}</p>

              <ul style={benefitListStyle}>
                <li style={benefitItemStyle}>
                  <span>✓</span>
                  <span>Contenu structuré et progressif</span>
                </li>
                <li style={benefitItemStyle}>
                  <span>✓</span>
                  <span>Accompagnement personnalisé</span>
                </li>
                <li style={benefitItemStyle}>
                  <span>✓</span>
                  <span>Accès illimité aux ressources</span>
                </li>
              </ul>

              {referralLink.rewardForReferrer && (
                <div
                  style={{
                    backgroundColor: '#F0F9EC',
                    color: '#72C15F',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '24px',
                  }}
                >
                  ✨ Offre spéciale : -10% avec cette recommandation
                </div>
              )}

              <Link href={`/p/${referralLink.product.slug}?ref=${slug}`}>
                <button
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#5DB847'
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#72C15F'
                  }}
                  style={buttonStyle}
                >
                  Découvrir le programme
                </button>
              </Link>
            </div>
          )}

        {/* Social Proof Section */}
        <div style={socialProofStyle}>
          <h2 style={sectionHeadingStyle}>Pourquoi consulter {referralLink.therapistName} ?</h2>

          <div style={proofGridStyle}>
            <div style={proofItemStyle}>
              <div style={proofIconStyle}>🎯</div>
              <div style={proofTitleStyle}>Approche personnalisée</div>
              <div style={proofDescriptionStyle}>
                Chaque séance est adaptée à vos besoins spécifiques et votre rythme.
              </div>
            </div>

            <div style={proofItemStyle}>
              <div style={proofIconStyle}>✨</div>
              <div style={proofTitleStyle}>Résultats concrets</div>
              <div style={proofDescriptionStyle}>
                Des méthodes éprouvées et efficaces pour des changements durables.
              </div>
            </div>

            <div style={proofItemStyle}>
              <div style={proofIconStyle}>🤝</div>
              <div style={proofTitleStyle}>Cadre bienveillant</div>
              <div style={proofDescriptionStyle}>
                Un espace sûr et confidentiel pour explorer vos préoccupations.
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div style={faqStyle}>
          <h2 style={sectionHeadingStyle}>Questions fréquentes</h2>

          {faqItems.map((item, index) => (
            <div key={index} style={index === faqItems.length - 1 ? faqItemLastStyle : faqItemStyle}>
              <div
                style={faqQuestionStyle}
                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
              >
                <span>{item.question}</span>
                <span style={{ fontSize: '18px' }}>{openFaqIndex === index ? '−' : '+'}</span>
              </div>

              {openFaqIndex === index && <div style={faqAnswerStyle}>{item.answer}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <div style={footerBadgeStyle}>✓ Recommandation de confiance</div>
        <p style={footerTextStyle}>Powered by Theralgo • Plateforme de recommandation thérapeutique</p>
      </div>
    </div>
  )
}

export default ReferralLanding
