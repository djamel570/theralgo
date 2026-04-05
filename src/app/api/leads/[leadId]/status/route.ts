import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    // Authentication check
    const { user, therapist } = await getAuthenticatedUser(req)
    if (!user || !therapist) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { status } = await req.json()

    if (!status || !['new', 'contacted', 'booked', 'lost'].includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      )
    }

    const supabase = createServiceSupabaseClient()

    // Verify lead exists and belongs to authenticated user
    const { data: lead } = await supabase
      .from('leads')
      .select('id, user_id')
      .eq('id', params.leadId)
      .single()

    if (!lead) {
      return NextResponse.json({ error: 'Lead introuvable' }, { status: 404 })
    }

    // Ownership check: verify lead belongs to authenticated user
    if (lead.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      )
    }

    // Update lead status
    const { data: updated, error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', params.leadId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, lead: updated })
  } catch (err) {
    console.error('Lead status update error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
