import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { OptimizationAgent, AgentConfig, AgentConfigSchema, DEFAULT_AGENT_CONFIG } from '@/lib/optimization-agent'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const apiLogger = logger.child({ component: 'api/agent/config' })

export async function GET(req: NextRequest) {
  try {
    apiLogger.info('Fetching agent config')

    // Get authenticated user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      apiLogger.warn('Unauthorized request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceSupabaseClient()

    // Load config from database or use defaults
    const config = await OptimizationAgent.loadConfig(user.id, supabase)

    apiLogger.info('Agent config retrieved successfully', { userId: user.id })

    return NextResponse.json({
      success: true,
      config,
      source: config === DEFAULT_AGENT_CONFIG ? 'defaults' : 'custom',
    })
  } catch (err) {
    apiLogger.error('Failed to fetch agent config', err)
    return NextResponse.json(
      { error: 'Failed to fetch agent config' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    apiLogger.info('Updating agent config')

    // Get authenticated user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      apiLogger.warn('Unauthorized request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Validate the configuration
    const validation = AgentConfigSchema.safeParse(body.config)
    if (!validation.success) {
      apiLogger.warn('Invalid agent config', { errors: validation.error.flatten(), userId: user.id })
      return NextResponse.json(
        { error: 'Invalid agent config', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const config = validation.data

    const supabase = createServiceSupabaseClient()

    // Check if config already exists
    const { data: existing } = await supabase
      .from('agent_configs')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      // Update existing config
      const { error } = await supabase
        .from('agent_configs')
        .update({
          config,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (error) {
        apiLogger.error('Failed to update agent config in database', error, { userId: user.id })
        throw error
      }

      apiLogger.info('Agent config updated', { userId: user.id })
    } else {
      // Insert new config
      const { error } = await supabase
        .from('agent_configs')
        .insert({
          user_id: user.id,
          config,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (error) {
        apiLogger.error('Failed to create agent config in database', error, { userId: user.id })
        throw error
      }

      apiLogger.info('Agent config created', { userId: user.id })
    }

    return NextResponse.json({
      success: true,
      config,
      message: 'Agent configuration updated successfully',
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      apiLogger.warn('Validation error', { errors: err.errors })
      return NextResponse.json(
        { error: 'Validation error', details: err.errors },
        { status: 400 }
      )
    }

    apiLogger.error('Failed to update agent config', err)
    return NextResponse.json(
      { error: 'Failed to update agent config' },
      { status: 500 }
    )
  }
}
