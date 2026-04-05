import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'crypto';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { recordConversion } from '@/lib/referral-engine';

// POST - Record a conversion from a referral (PUBLIC - no auth for booking form submissions)
const conversionSchema = z.object({
  referralSlug: z.string().min(1, 'Referral slug is required'),
  conversionType: z.enum(['booking', 'inquiry', 'signup', 'purchase']),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  message: z.string().max(1000).optional(),
  productId: z.string().optional(),
  bookingDate: z.string().datetime().optional(),
  bookingTime: z.string().optional(),
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
      logger.warn('Rate limit exceeded for referral conversion', {
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
    const validation = conversionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const {
      referralSlug,
      conversionType,
      name,
      email,
      phone,
      message,
      productId,
      bookingDate,
      bookingTime,
    } = validation.data;

    logger.info('Processing referral conversion', {
      referralSlug,
      conversionType,
      email,
    });

    // Record the conversion
    const conversion = await recordConversion({
      referralSlug,
      conversionType,
      name,
      email,
      phone,
      message,
      productId,
      bookingDate: bookingDate ? new Date(bookingDate) : undefined,
      bookingTime,
      ipHash,
    });

    logger.info('Referral conversion recorded successfully', {
      referralSlug,
      conversionId: conversion.id,
      conversionType,
    });

    // If booking type conversion, also create a booking/lead
    if (conversionType === 'booking' && productId) {
      try {
        logger.info('Creating booking from referral conversion', {
          conversionId: conversion.id,
          email,
        });
        // Booking creation would be handled in recordConversion or here
        // Additional booking logic can be added here if needed
      } catch (bookingError) {
        logger.warn('Failed to create booking from referral', {
          error: bookingError instanceof Error ? bookingError.message : 'Unknown error',
          conversionId: conversion.id,
        });
        // Don't fail the whole request if booking creation fails
      }
    }

    // Prepare response with reward info if applicable
    const response: any = {
      success: true,
      data: {
        conversionId: conversion.id,
        referralSlug,
        conversionType,
      },
    };

    // Include reward info if applicable
    if (conversion.rewardEarned) {
      response.data.reward = {
        type: conversion.rewardType,
        value: conversion.rewardValue,
        earned: conversion.rewardEarned,
      };
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    logger.error('Failed to record referral conversion', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Failed to record referral conversion' },
      { status: 500 }
    );
  }
}
