import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import {
  createReferralLink,
  deactivateLink,
  getReferralLinks,
} from '@/lib/referral-engine';

// GET - List therapist's referral links
const getQuerySchema = z.object({
  active: z.enum(['true', 'false']).optional(),
  limit: z.string().transform(Number).optional(),
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
    const queryValidation = getQuerySchema.safeParse(searchParams);

    if (!queryValidation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryValidation.error.flatten() },
        { status: 400 }
      );
    }

    const { active, limit } = queryValidation.data;
    const filterActive = active === 'true' ? true : active === 'false' ? false : undefined;

    logger.info('Fetching referral links', {
      userId: user.id,
      active: filterActive,
      limit: limit || 50,
    });

    // Fetch referral links
    const links = await getReferralLinks({
      userId: user.id,
      active: filterActive,
      limit: limit || 50,
    });

    return NextResponse.json({
      success: true,
      data: links,
      count: links.length,
    });
  } catch (error) {
    logger.error('Failed to fetch referral links', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Failed to fetch referral links' },
      { status: 500 }
    );
  }
}

// POST - Create a new referral link
const createLinkSchema = z.object({
  referrerName: z.string().min(1, 'Referrer name is required'),
  referrerEmail: z.string().email().optional(),
  referrerPhone: z.string().optional(),
  linkType: z.enum(['standard', 'social', 'email', 'whatsapp']),
  productId: z.string().optional(),
  rewardType: z.enum(['commission', 'discount', 'credit', 'points']).optional(),
  rewardValue: z.number().positive().optional(),
  customMessage: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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
    const validation = createLinkSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const {
      referrerName,
      referrerEmail,
      referrerPhone,
      linkType,
      productId,
      rewardType,
      rewardValue,
      customMessage,
    } = validation.data;

    logger.info('Creating referral link', {
      userId: user.id,
      referrerName,
      linkType,
    });

    // Create referral link
    const link = await createReferralLink({
      userId: user.id,
      referrerName,
      referrerEmail: referrerEmail || user.email,
      referrerPhone,
      linkType,
      productId,
      rewardType,
      rewardValue,
      customMessage,
    });

    logger.info('Referral link created successfully', {
      userId: user.id,
      linkId: link.id,
    });

    return NextResponse.json(
      {
        success: true,
        data: link,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Failed to create referral link', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Failed to create referral link' },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate a referral link
const deleteLinkSchema = z.object({
  linkId: z.string().min(1, 'Link ID is required'),
});

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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
    const validation = deleteLinkSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { linkId } = validation.data;

    logger.info('Deactivating referral link', {
      userId: user.id,
      linkId,
    });

    // Deactivate link
    const result = await deactivateLink({
      linkId,
      userId: user.id,
    });

    logger.info('Referral link deactivated successfully', {
      userId: user.id,
      linkId,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to deactivate referral link', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Failed to deactivate referral link' },
      { status: 500 }
    );
  }
}
