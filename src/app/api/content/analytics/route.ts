import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import {
  getContentInsights,
  recordMetrics,
} from '@/lib/content-analytics';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const insightsQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d']),
});

const metricsSchema = z.object({
  views: z.number().int().nonnegative().optional(),
  likes: z.number().int().nonnegative().optional(),
  comments: z.number().int().nonnegative().optional(),
  shares: z.number().int().nonnegative().optional(),
  clicks: z.number().int().nonnegative().optional(),
  conversions: z.number().int().nonnegative().optional(),
  engagementRate: z.number().nonnegative().max(1).optional(),
  avgTimeOnPage: z.number().nonnegative().optional(),
});

const recordMetricsSchema = z.object({
  contentId: z.string().uuid(),
  metrics: metricsSchema,
  recordedAt: z.string().datetime().optional(),
});

type Metrics = z.infer<typeof metricsSchema>;

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Rate limiting
    const limiter = rateLimit('analytics');
    await limiter.check(req);

    // Authentication
    const { user, therapist } = await getAuthenticatedUser();

    // Parse and validate query params
    const url = new URL(req.url);
    const period = url.searchParams.get('period') || '30d';

    const params = insightsQuerySchema.parse({ period });

    logger.info('Fetching content insights', {
      requestId,
      therapistId: therapist.id,
      period: params.period,
    });

    const insights = await getContentInsights({
      therapistId: therapist.id,
      period: params.period as '7d' | '30d' | '90d',
    });

    logger.info('Content insights retrieved', {
      requestId,
      therapistId: therapist.id,
      contentCount: insights.contentPieces.length,
      totalViews: insights.totalMetrics.views,
      totalEngagement: insights.totalMetrics.engagementRate,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          period: params.period,
          contentPieces: insights.contentPieces,
          totalMetrics: insights.totalMetrics,
          topPerformers: insights.topPerformers,
          trends: insights.trends,
          recommendations: insights.recommendations,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Validation error in get insights', {
        requestId,
        errors: error.errors,
      });
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    logger.error('Error fetching insights', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to fetch insights', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Rate limiting
    const limiter = rateLimit('analytics');
    await limiter.check(req);

    // Authentication
    const { user, therapist } = await getAuthenticatedUser();

    // Parse and validate body
    const body = await req.json();
    const data = recordMetricsSchema.parse(body);

    logger.info('Recording content metrics', {
      requestId,
      therapistId: therapist.id,
      contentId: data.contentId,
      recordedAt: data.recordedAt,
    });

    // Validate at least one metric is provided
    const hasMetrics = Object.values(data.metrics).some((v) => v !== undefined && v !== null);
    if (!hasMetrics) {
      return NextResponse.json(
        {
          error: 'At least one metric must be provided',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const result = await recordMetrics({
      therapistId: therapist.id,
      contentId: data.contentId,
      metrics: data.metrics as Metrics,
      recordedAt: data.recordedAt ? new Date(data.recordedAt) : undefined,
    });

    logger.info('Metrics recorded', {
      requestId,
      therapistId: therapist.id,
      contentId: data.contentId,
      metricsUpdated: result.metricsUpdated,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          contentId: result.contentId,
          metrics: result.metrics,
          updatedAt: result.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Validation error in record metrics', {
        requestId,
        errors: error.errors,
      });

      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        logger.warn('Content not found for metrics recording', {
          requestId,
        });
        return NextResponse.json(
          {
            error: 'Content piece not found',
            code: 'NOT_FOUND',
          },
          { status: 404 }
        );
      }

      if (error.message.includes('Unauthorized')) {
        logger.warn('Unauthorized metrics recording attempt', { requestId });
        return NextResponse.json(
          { error: 'Unauthorized', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }
    }

    logger.error('Error recording metrics', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: 'Failed to record metrics',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
