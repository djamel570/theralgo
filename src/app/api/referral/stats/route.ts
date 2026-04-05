import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { getReferralStats } from '@/lib/referral-engine';

// GET - Get referral analytics
const statsQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', 'all']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const queryValidation = statsQuerySchema.safeParse(searchParams);

    if (!queryValidation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryValidation.error.flatten() },
        { status: 400 }
      );
    }

    const { period } = queryValidation.data;
    const selectedPeriod = period || '30d';

    logger.info('Fetching referral statistics', {
      userId: user.id,
      period: selectedPeriod,
    });

    // Fetch referral statistics
    const stats = await getReferralStats({
      userId: user.id,
      period: selectedPeriod,
    });

    return NextResponse.json({
      success: true,
      data: {
        period: selectedPeriod,
        ...stats,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch referral statistics', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Failed to fetch referral statistics' },
      { status: 500 }
    );
  }
}
