import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'crypto';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { trackClick } from '@/lib/referral-engine';

// POST - Track a click on a referral link (PUBLIC - no auth)
const trackSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
  source: z.enum(['direct', 'whatsapp', 'email', 'social', 'sms']).optional(),
});

function getClientIpHash(request: NextRequest): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown';

  // Hash the IP for privacy
  return createHash('sha256').update(ip).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit with 'public' tier
    const ipHash = getClientIpHash(request);
    const rateLimitResult = await rateLimit('public', ipHash);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for referral tracking', {
        ipHash,
        remaining: rateLimitResult.remaining,
      });
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate request body
    const validation = trackSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { slug, source } = validation.data;

    logger.info('Tracking referral click', {
      slug,
      source: source || 'direct',
      ipHash,
    });

    // Track the click
    const clickData = await trackClick({
      slug,
      source: source || 'direct',
      ipHash,
      userAgent: request.headers.get('user-agent') || undefined,
      referer: request.headers.get('referer') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        clickId: clickData.id,
        redirectUrl: clickData.redirectUrl,
      },
    });
  } catch (error) {
    logger.error('Failed to track referral click', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Failed to track referral click' },
      { status: 500 }
    );
  }
}
