import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import ProductSalesPage from './ProductSalesPage'

interface PageProps {
  params: Promise<{ productSlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productSlug } = await params

  const supabase = await createServerSupabaseClient()

  const { data: product } = await supabase
    .from('products')
    .select('title, description, price')
    .eq('slug', productSlug)
    .eq('status', 'published')
    .single()

  if (!product) {
    return {
      title: 'Produit introuvable',
      description: 'Le produit que vous recherchez n\'existe pas.',
    }
  }

  return {
    title: product.title,
    description: product.description || `Achetez ${product.title} à partir de ${product.price}€`,
    openGraph: {
      title: product.title,
      description: product.description || `Achetez ${product.title}`,
      type: 'website',
    },
  }
}

export default async function Page({ params }: PageProps) {
  const { productSlug } = await params

  const supabase = await createServerSupabaseClient()

  // Fetch product with therapist info
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*, therapist:user_id(id, name, email, phone, specialty, city, bio, credentials, photo_url, approach_description)')
    .eq('slug', productSlug)
    .eq('status', 'published')
    .single()

  if (productError || !product) {
    notFound()
  }

  // Type the therapist properly
  const therapist = product.therapist as unknown as {
    id: string
    name: string
    email: string
    phone?: string
    specialty?: string
    city?: string
    bio?: string
    credentials?: string
    photo_url?: string
    approach_description?: string
  }

  return <ProductSalesPage product={product} therapist={therapist} />
}
