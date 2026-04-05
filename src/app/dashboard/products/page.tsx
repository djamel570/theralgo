import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import TherapistProducts from './TherapistProducts'

export default async function ProductsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch initial products
  const { data: products } = await supabase
    .from('digital_products')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <TherapistProducts
      initialProducts={products || []}
      userId={user.id}
    />
  )
}
