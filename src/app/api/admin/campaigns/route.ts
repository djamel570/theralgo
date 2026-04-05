import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'

const ADMIN_EMAILS = ['admin@theralgo.fr', process.env.ADMIN_EMAIL || '']

export async function PATCH(req: NextRequest) {
  try {
    // Verify admin
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { campaignId, action } = await req.json()

    if (!campaignId || !['pause', 'activate'].includes(action)) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
    }

    const supabaseAdmin = createServiceSupabaseClient()

    const newStatus = action === 'pause' ? 'paused' : 'active'

    const { error } = await supabaseAdmin
      .from('campaigns')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', campaignId)

    if (error) throw error

    return NextResponse.json({ success: true, status: newStatus })
  } catch (err) {
    console.error('Admin campaign update error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
