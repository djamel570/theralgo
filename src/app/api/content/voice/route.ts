import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import {
  getVoiceProfile,
  processInterviewAnswers,
  buildVoiceProfile,
} from '@/lib/voice-dna';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const voiceSampleSchema = z.object({
  id: z.string(),
  type: z.enum(['writing_sample', 'audio_transcription', 'case_description']),
  content: z.string(),
  metadata: z.record(z.any()).optional(),
});

const interviewRequestSchema = z.object({
  type: z.literal('interview'),
  answers: z.record(z.string()),
});

const buildRequestSchema = z.object({
  type: z.literal('build'),
  samples: z.array(voiceSampleSchema),
});

const voiceRequestSchema = z.union([interviewRequestSchema, buildRequestSchema]);

type VoiceRequest = z.infer<typeof voiceRequestSchema>;

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Rate limiting
    const limiter = rateLimit('voice_profile');
    await limiter.check(req);

    // Authentication
    const { user, therapist } = await getAuthenticatedUser();

    logger.info('Fetching voice profile', {
      requestId,
      therapistId: therapist.id,
    });

    const voiceProfile = await getVoiceProfile({
      therapistId: therapist.id,
    });

    if (!voiceProfile) {
      logger.info('Voice profile not found', {
        requestId,
        therapistId: therapist.id,
      });

      return NextResponse.json(
        {
          success: true,
          data: null,
          message: 'No voice profile configured yet',
        },
        { status: 200 }
      );
    }

    logger.info('Voice profile retrieved', {
      requestId,
      therapistId: therapist.id,
      voiceProfileId: voiceProfile.id,
    });

    return NextResponse.json(
      {
        success: true,
        data: voiceProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error fetching voice profile', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: 'Failed to fetch voice profile',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Rate limiting
    const limiter = rateLimit('voice_profile');
    await limiter.check(req);

    // Authentication
    const { user, therapist } = await getAuthenticatedUser();

    // Parse and validate body
    const body = await req.json();
    const data = voiceRequestSchema.parse(body);

    logger.info('Processing voice profile request', {
      requestId,
      therapistId: therapist.id,
      type: data.type,
    });

    let result;

    if (data.type === 'interview') {
      // Validate interview has required questions
      const requiredQuestions = [
        'therapeutic_approach',
        'key_strengths',
        'communication_style',
        'specialization',
      ];
      const providedQuestions = Object.keys(data.answers);
      const missingQuestions = requiredQuestions.filter(
        (q) => !providedQuestions.includes(q)
      );

      if (missingQuestions.length > 0) {
        logger.warn('Missing interview questions', {
          requestId,
          therapistId: therapist.id,
          missingQuestions,
        });

        return NextResponse.json(
          {
            error: `Missing required interview questions: ${missingQuestions.join(', ')}`,
            code: 'MISSING_QUESTIONS',
            missingQuestions,
          },
          { status: 400 }
        );
      }

      result = await processInterviewAnswers({
        therapistId: therapist.id,
        answers: data.answers,
      });

      logger.info('Interview processed and voice profile created', {
        requestId,
        therapistId: therapist.id,
        voiceProfileId: result.id,
      });
    } else {
      if (data.samples.length === 0) {
        return NextResponse.json(
          {
            error: 'At least one voice sample is required',
            code: 'VALIDATION_ERROR',
          },
          { status: 400 }
        );
      }

      result = await buildVoiceProfile({
        therapistId: therapist.id,
        samples: data.samples,
      });

      logger.info('Voice profile built from samples', {
        requestId,
        therapistId: therapist.id,
        voiceProfileId: result.id,
        sampleCount: data.samples.length,
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.id,
          therapistId: result.therapistId,
          voiceCharacteristics: result.voiceCharacteristics,
          completeness: result.completeness,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Validation error in voice profile request', {
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
      if (error.message.includes('Unauthorized')) {
        logger.warn('Unauthorized voice profile request', { requestId });
        return NextResponse.json(
          { error: 'Unauthorized', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }
    }

    logger.error('Error processing voice profile', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: 'Failed to process voice profile',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
