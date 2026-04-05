/**
 * Page d'accès au contenu du produit
 * Composant serveur - valide le token et charge le contenu
 */

import { redirect } from 'next/navigation'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { AccessContent } from './AccessContent'

interface Props {
  params: Promise<{ accessToken: string }>
}

export default async function AccessPage(props: Props) {
  const params = await props.params
  const { accessToken } = params

  try {
    const supabase = createServiceSupabaseClient()

    // 1. Valider le token
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('*, digital_products(*)')
      .eq('access_token', accessToken)
      .eq('status', 'paid')
      .single()

    if (purchaseError || !purchase) {
      redirect('/access-denied')
    }

    // 2. Tracker l'accès
    await supabase.from('product_analytics').insert({
      product_id: purchase.product_id,
      event_type: 'access',
      buyer_email: purchase.buyer_email,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    })

    // 3. Passer les données au composant client
    return (
      <AccessContent
        purchase={purchase}
        product={purchase.digital_products}
      />
    )
  } catch (error) {
    console.error('Erreur lors du chargement de la page d\'accès:', error)
    redirect('/access-denied')
  }
}

export async function generateMetadata(props: Props) {
  const params = await props.params
  const { accessToken } = params

  try {
    const supabase = createServiceSupabaseClient()
    const { data: purchase } = await supabase
      .from('purchases')
      .select('*, digital_products(title)')
      .eq('access_token', accessToken)
      .single()

    if (purchase?.digital_products?.title) {
      return {
        title: `Accès: ${purchase.digital_products.title} | Theralgo`,
        description: 'Accédez à votre contenu exclusif',
      }
    }
  } catch {
    // Fallback to default metadata
  }

  return {
    title: 'Accès au contenu | Theralgo',
    description: 'Accédez à votre contenu exclusif sur Theralgo',
  }
}
