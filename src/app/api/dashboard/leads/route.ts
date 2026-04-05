/**
 * GET /api/dashboard/leads
 * List leads for authenticated therapist with filters
 * Query params: status, search, dateFrom, dateTo, page, limit
 *
 * PATCH /api/dashboard/leads
 * Update lead status or notes
 * Body: { leadId, status?, notes? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const leadsLogger = logger.child({ component: 'LeadsAPI' })

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // 2. Get query parameters
    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const search = url.searchParams.get('search')
    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
    const offset = (page - 1) * limit

    // 3. Build query
    const supabase = createServiceSupabaseClient()
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('therapist_id', user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      // Use ilike for case-insensitive search
      query = query.or(`name.ilike.%${searchLower}%,email.ilike.%${searchLower}%`)
    }

    if (dateFrom) {
      query = query.gte('created_at', new Date(dateFrom).toISOString())
    }

    if (dateTo) {
      query = query.lte('created_at', new Date(dateTo).toISOString())
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: leads, count, error } = await query

    if (error) {
      throw error
    }

    leadsLogger.info('Leads fetched', {
      userId: user.id,
      count: leads?.length || 0,
      total: count || 0
    })

    return NextResponse.json({
      success: true,
      leads: (leads || []).map(lead => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        date: lead.created_at,
        source: lead.source || 'Campagne interne',
        status: lead.status || 'new',
        qualification_score: lead.qualification_score || 0,
        qualification_answers: lead.qualification_answers,
        notes: lead.notes
      })),
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    leadsLogger.error('Erreur lors de la récupération des leads', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body = await req.json()
    const { leadId, status, notes } = body

    if (!leadId) {
      return NextResponse.json(
        { error: 'leadId requis' },
        { status: 400 }
      )
    }

    // 3. Verify lead belongs to user
    const supabase = createServiceSupabaseClient()
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('therapist_id', user.id)
      .single()

    if (fetchError || !lead) {
      return NextResponse.json(
        { error: 'Lead non trouvé' },
        { status: 404 }
      )
    }

    // 4. Prepare update object
    const updateData: Record<string, any> = {}
    if (status) {
      updateData.status = status
    }
    if (notes !== undefined) {
      updateData.notes = notes
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnée à mettre à jour' },
        { status: 400 }
      )
    }

    // 5. Update lead
    const { error: updateError } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId)

    if (updateError) {
      throw updateError
    }

    leadsLogger.info('Lead updated', {
      userId: user.id,
      leadId,
      updates: Object.keys(updateData)
    })

    return NextResponse.json({
      success: true,
      message: 'Lead mis à jour avec succès',
      lead: {
        id: lead.id,
        ...updateData
      }
    })
  } catch (error) {
    leadsLogger.error('Erreur lors de la mise à jour du lead', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
