import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { generateContent } from '@/lib/content-engine';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const generateContentSchema = z.object({
  contentType: z.enum(['blog_post', 'social_media', 'email', 'video_script', 'podcast_outline']),
  topic: z.string().optional(),
  intention: z.enum(['educational', 'promotional', 'inspirational', 'community_building']).optional(),
  customInstructions: z.string().max(2000).optional(),
});

type GenerateContentRequest = z.infer<typeof generateContentSchema>;

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Rate limiting
    const limiter = rateLimit('content_generate');
    await limiter.check(req);

    // Authentication
    const { user, therapist } = await getAuthenticatedUser();

    logger.info('Content generation request started', {
      requestId,
      therapistId: therapist.id,
      userId: user.id,
    });

    // Parse and validate body
    const body = await req.json();
    const data = generateContentSchema.parse(body);

    // Validate therapist has required voice profile setup
    if (!therapist.voiceProfileId && !data.customInstructions) {
      logger.warn('Missing voice profile for content generation', {
        requestId,
        therapistId: therapist.id,
      });
      return NextResponse.json(
        {
          error: 'Voice profile not configured. Please set up your voice profile first.',
          code: 'VOICE_PROFILE_REQUIRED',
        },
        { status: 400 }
      );
    }

    // Generate content
    const result = await generateContent({
      therapistId: therapist.id,
      contentType: data.contentType,
      topic: data.topic,
      intention: data.intention,
      customInstructions: data.customInstructions,
      voiceProfileId: therapist.voiceProfileId,
    });

    logger.info('Content generation completed', {
      requestId,
      therapistId: therapist.id,
      contentType: data.contentType,
      contentId: result.id,
      tokensUsed: result.tokensUsed,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.id,
          content: result.content,
          contentType: result.contentType,
          createdAt: result.createdAt,
          tokensUsed: result.tokensUsed,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Validation error in generate content', {
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
        logger.warn('Rate limit exceeded', { requestId });
        return NextResponse.json(
          {
            error: 'Rate limit exceeded. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
          },
          { status: 429 }
        );
      }

      if (error.message.includes('Unauthorized')) {
        logger.warn('Unauthorized content generation attempt', { requestId });
        return NextResponse.json(
          { error: 'Unauthorized', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }
    }

    logger.error('Unexpected error in generate content', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: 'Failed to generate content',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
