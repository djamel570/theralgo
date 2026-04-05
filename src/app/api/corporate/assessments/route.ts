import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'
import { authApiLimiter, publicApiLimiter } from '@/lib/rate-limit'
import { AssessmentCreateSchema, AssessmentSubmitSchema } from '@/lib/validations'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * Mock implementations - replace with actual database calls
 */
async function getAssessmentResults(clientId: string, type?: string) {
  // TODO: Implement database query
  logger.info('Fetching assessment results', { clientId, type })
  return {
    success: true,
    data: [],
    count: 0,
  }
}

async function createAssessmentSurvey(userId: string, data: any) {
  // TODO: Implement database insert and generate shareable URL
  const assessmentId = `assessment_${Date.now()}`
  const shareableUrl = `${process.env.NEXT_PUBLIC_APP_URL}/assess/${assessmentId}`

  logger.info('Creating assessment survey', { userId, clientId: data.clientId, type: data.type })
  return {
    id: assessmentId,
    clientId: data.clientId,
    sessionId: data.sessionId,
    type: data.type,
    shareableUrl,
    status: 'active',
    questions: [
      { id: 'q1', text: 'How would you rate your overall stress level?', type: 'scale' },
      { id: 'q2', text: 'How supported do you feel at work?', type: 'scale' },
      { id: 'q3', text: 'What are your main wellness concerns?', type: 'open' },
    ],
    created_at: new Date().toISOString(),
  }
}

async function submitAssessment(assessmentId: string, responses: any, scores?: any) {
  // TODO: Implement database update and score calculation
  logger.info('Submitting assessment', { assessmentId })
  return {
    success: true,
    assessmentId,
    submitted_at: new Date().toISOString(),
    confirmation: `Assessment ${assessmentId} has been recorded`,
  }
}

/**
 * Helper to get client IP hash for rate limiting public endpoints
 */
function getClientIpHash(req: NextRequest): string {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  return createHash('sha256').update(ip).digest('hex')
}

/**
 * GET /api/corporate/assessments
 * Get assessment results for a client (auth required)
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit
    const ipHash = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await authApiLimiter.check(30, ipHash)

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for GET /api/corporate/assessments', { userId: user.id })
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.reset) } }
      )
    }

    // Parse query parameters
    const searchParams = Object.fromEntries(req.nextUrl.searchParams)
    const clientId = searchParams.clientId as string | undefined
    const type = searchParams.type as string | undefined

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId query parameter is required' },
        { status: 400 }
      )
    }

    logger.info('GET /api/corporate/assessments', { userId: user.id, clientId, type })

    // Fetch assessment results
    const result = await getAssessmentResults(clientId, type)

    return NextResponse.json(result)
  } catch (error) {
    logger.error('GET /api/corporate/assessments failed', error as Error)
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/corporate/assessments
 * Create an assessment survey and get a shareable URL (auth required)
 */
export async function POST(req: NextRequest) {
  try {
    // Check if this is a submission (no auth required) or creation (auth required)
    const body = await req.json()
    const isSubmission = body.assessmentId && body.responses

    if (isSubmission) {
      // This is an assessment submission - handle below with public rate limiting
      // Re-validate after checking method
    } else {
      // This is a survey creation - requires auth
      const user = await getAuthenticatedUser(req)
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Rate limit
      const ipHash = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      const rateLimitResult = await authApiLimiter.check(30, ipHash)

      if (!rateLimitResult.success) {
        logger.warn('Rate limit exceeded for POST /api/corporate/assessments', { userId: user.id })
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429, headers: { 'Retry-After': String(rateLimitResult.reset) } }
        )
      }

      // Validate body for survey creation
      const validation = AssessmentCreateSchema.safeParse(body)

      if (!validation.success) {
        logger.warn('Validation error in POST /api/corporate/assessments', {
          userId: user.id,
          errors: validation.error.flatten(),
        })
        return NextResponse.json(
          { error: 'Validation error', details: validation.error.flatten() },
          { status: 400 }
        )
      }

      logger.info('POST /api/corporate/assessments', {
        userId: user.id,
        clientId: validation.data.clientId,
        type: validation.data.type,
      })

      // Create assessment survey
      const assessment = await createAssessmentSurvey(user.id, validation.data)

      return NextResponse.json(
        { success: true, data: assessment },
        { status: 201 }
      )
    }

    // If we got here without returning, something went wrong
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  } catch (error) {
    logger.error('POST /api/corporate/assessments failed', error as Error)
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/corporate/assessments
 * Submit assessment responses (PUBLIC - no auth required, rate limited)
 */
export async function PUT(req: NextRequest) {
  try {
    // Rate limit by IP hash (public endpoint)
    const ipHash = getClientIpHash(req)
    const rateLimitResult = await publicApiLimiter.check(10, ipHash)

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for PUT /api/corporate/assessments', { ipHash })
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.reset) } }
      )
    }

    // Parse and validate body
    const body = await req.json()
    const validation = AssessmentSubmitSchema.safeParse(body)

    if (!validation.success) {
      logger.warn('Validation error in PUT /api/corporate/assessments', {
        errors: validation.error.flatten(),
      })
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { assessmentId, responses, scores } = validation.data

    logger.info('PUT /api/corporate/assessments', { assessmentId })

    // Submit assessment
    const result = await submitAssessment(assessmentId, responses, scores)

    return NextResponse.json(result)
  } catch (error) {
    logger.error('PUT /api/corporate/assessments failed', error as Error)
    return NextResponse.json(
      { error: 'Failed to submit assessment' },
      { status: 500 }
    )
  }
}
