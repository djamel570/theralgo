import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import {
  getCalendar,
  planWeek,
  planMonth,
  approveWeek,
  skipWeek,
} from '@/lib/editorial-calendar';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const getCalendarSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

const planSchema = z.object({
  type: z.enum(['week', 'month']),
  startDate: z.string().date().optional(),
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2024).optional(),
});

const approveSkipSchema = z.object({
  weekId: z.string().uuid(),
  action: z.enum(['approve', 'skip']),
  reason: z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Rate limiting
    const limiter = rateLimit('content_calendar');
    await limiter.check(req);

    // Authentication
    const { user, therapist } = await getAuthenticatedUser();

    // Parse and validate query params
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const params = getCalendarSchema.parse({ startDate, endDate });

    logger.info('Fetching editorial calendar', {
      requestId,
      therapistId: therapist.id,
      startDate: params.startDate,
      endDate: params.endDate,
    });

    const calendar = await getCalendar({
      therapistId: therapist.id,
      startDate: new Date(params.startDate),
      endDate: new Date(params.endDate),
    });

    logger.info('Editorial calendar retrieved', {
      requestId,
      therapistId: therapist.id,
      weekCount: calendar.weeks.length,
    });

    return NextResponse.json(
      {
        success: true,
        data: calendar,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Validation error in get calendar', {
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

    logger.error('Error fetching calendar', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to fetch calendar', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Rate limiting
    const limiter = rateLimit('content_calendar');
    await limiter.check(req);

    // Authentication
    const { user, therapist } = await getAuthenticatedUser();

    // Parse and validate body
    const body = await req.json();
    const data = planSchema.parse(body);

    logger.info('Planning editorial schedule', {
      requestId,
      therapistId: therapist.id,
      type: data.type,
    });

    let result;

    if (data.type === 'week') {
      if (!data.startDate) {
        return NextResponse.json(
          {
            error: 'startDate is required for week planning',
            code: 'VALIDATION_ERROR',
          },
          { status: 400 }
        );
      }
      result = await planWeek({
        therapistId: therapist.id,
        startDate: new Date(data.startDate),
      });
    } else {
      const currentYear = new Date().getFullYear();
      const month = data.month || new Date().getMonth() + 1;
      const year = data.year || currentYear;

      result = await planMonth({
        therapistId: therapist.id,
        month,
        year,
      });
    }

    logger.info('Editorial plan created', {
      requestId,
      therapistId: therapist.id,
      planId: result.id,
      type: data.type,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Validation error in plan calendar', {
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

    logger.error('Error planning calendar', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to plan calendar', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Rate limiting
    const limiter = rateLimit('content_calendar');
    await limiter.check(req);

    // Authentication
    const { user, therapist } = await getAuthenticatedUser();

    // Parse and validate body
    const body = await req.json();
    const data = approveSkipSchema.parse(body);

    logger.info('Processing week approval/skip', {
      requestId,
      therapistId: therapist.id,
      weekId: data.weekId,
      action: data.action,
    });

    let result;

    if (data.action === 'approve') {
      result = await approveWeek({
        therapistId: therapist.id,
        weekId: data.weekId,
      });
    } else {
      result = await skipWeek({
        therapistId: therapist.id,
        weekId: data.weekId,
        reason: data.reason,
      });
    }

    logger.info('Week processed', {
      requestId,
      therapistId: therapist.id,
      weekId: data.weekId,
      action: data.action,
      status: result.status,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Validation error in approve/skip week', {
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

    logger.error('Error processing week', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to process week', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
