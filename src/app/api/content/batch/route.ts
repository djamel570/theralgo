import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { generateWeeklyBatch } from '@/lib/content-engine';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const batchRequestSchema = z.object({
  weekStart: z.string().date(),
  includeScheduling: z.boolean().optional().default(true),
  overrideVoiceProfile: z.boolean().optional().default(false),
});

type BatchRequest = z.infer<typeof batchRequestSchema>;

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Rate limiting - batch generation is more expensive
    const limiter = rateLimit('batch_generation');
    await limiter.check(req);

    // Authentication
    const { user, therapist } = await getAuthenticatedUser();

    // Parse and validate body
    const body = await req.json();
    const data = batchRequestSchema.parse(body);

    // Validate week start date is valid
    const weekStart = new Date(data.weekStart);
    const dayOfWeek = weekStart.getDay();

    if (dayOfWeek !== 1) {
      // 1 = Monday
      logger.warn('Invalid week start date provided', {
        requestId,
        therapistId: therapist.id,
        weekStart: data.weekStart,
        dayOfWeek,
      });

      return NextResponse.json(
        {
          error: 'Week start date must be a Monday',
          code: 'INVALID_WEEK_START',
          providedDate: data.weekStart,
          expectedDay: 'Monday',
        },
        { status: 400 }
      );
    }

    // Validate therapist has voice profile if not overriding
    if (!data.overrideVoiceProfile && !therapist.voiceProfileId) {
      logger.warn('Missing voice profile for batch generation', {
        requestId,
        therapistId: therapist.id,
      });

      return NextResponse.json(
        {
          error:
            'Voice profile not configured. Please set up your voice profile first.',
          code: 'VOICE_PROFILE_REQUIRED',
        },
        { status: 400 }
      );
    }

    logger.info('Starting weekly batch generation', {
      requestId,
      therapistId: therapist.id,
      weekStart: data.weekStart,
      includeScheduling: data.includeScheduling,
    });

    const result = await generateWeeklyBatch({
      therapistId: therapist.id,
      weekStart,
      includeScheduling: data.includeScheduling,
      voiceProfileId: therapist.voiceProfileId,
    });

    logger.info('Weekly batch generation completed', {
      requestId,
      therapistId: therapist.id,
      batchId: result.id,
      contentCount: result.contentPieces.length,
      tokensUsed: result.tokensUsed,
      estimatedCost: result.estimatedCost,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.id,
          batchStart: result.batchStart,
          batchEnd: result.batchEnd,
          contentPieces: result.contentPieces.map((piece) => ({
            id: piece.id,
            contentType: piece.contentType,
            topic: piece.topic,
            scheduledDate: piece.scheduledDate,
            status: piece.status,
          })),
          summary: {
            totalContent: result.contentPieces.length,
            tokensUsed: result.tokensUsed,
            estimatedCost: result.estimatedCost,
            generationTime: result.generationTime,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Validation error in batch generation', {
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
      if (error.message.includes('rate limit')) {
        logger.warn('Rate limit exceeded on batch generation', { requestId });
        return NextResponse.json(
          {
            error: 'Rate limit exceeded. Batch generation is resource-intensive. Please try again in a few minutes.',
            code: 'RATE_LIMIT_EXCEEDED',
          },
          { status: 429 }
        );
      }

      if (error.message.includes('Unauthorized')) {
        logger.warn('Unauthorized batch generation attempt', { requestId });
        return NextResponse.json(
          { error: 'Unauthorized', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      if (error.message.includes('timeout')) {
        logger.error('Batch generation timed out', {
          requestId,
          therapistId: (await getAuthenticatedUser()).therapist.id,
        });

        return NextResponse.json(
          {
            error: 'Batch generation timed out. Please try again with fewer days or simpler content.',
            code: 'TIMEOUT',
          },
          { status: 504 }
        );
      }
    }

    logger.error('Unexpected error in batch generation', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: 'Failed to generate weekly batch',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
