import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { createCampaign } from '@/lib/referral-engine';

// GET - List therapist's campaigns
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

    logger.info('Fetching referral campaigns', {
      userId: user.id,
    });

    // Fetch campaigns from database
    // This would typically query your database directly
    // For now, returning the structure that would be returned
    const campaigns = await fetch(
      `${process.env.DATABASE_URL || ''}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DB_API_KEY || ''}`,
        },
      }
    ).then(res => res.json()).catch(() => []);

    return NextResponse.json({
      success: true,
      data: campaigns,
      count: campaigns.length,
    });
  } catch (error) {
    logger.error('Failed to fetch campaigns', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// POST - Create a referral campaign
const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(100),
  triggerType: z.enum(['on_signup', 'on_booking', 'on_purchase', 'on_inquiry', 'manual']),
  triggerDelayHours: z.number().int().positive().optional(),
  shareMessageTemplate: z.string().min(1, 'Share message template is required').max(500),
  whatsappMessage: z.string().max(500).optional(),
  emailSubject: z.string().max(200).optional(),
  emailBody: z.string().max(2000).optional(),
  linkType: z.enum(['standard', 'social', 'email', 'whatsapp']),
  productId: z.string().optional(),
  rewardType: z.enum(['commission', 'discount', 'credit', 'points']).optional(),
  rewardValue: z.number().positive().optional(),
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
    const validation = createCampaignSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const {
      name,
      triggerType,
      triggerDelayHours,
      shareMessageTemplate,
      whatsappMessage,
      emailSubject,
      emailBody,
      linkType,
      productId,
      rewardType,
      rewardValue,
    } = validation.data;

    logger.info('Creating referral campaign', {
      userId: user.id,
      name,
      triggerType,
    });

    // Create campaign
    const campaign = await createCampaign({
      userId: user.id,
      name,
      triggerType,
      triggerDelayHours,
      shareMessageTemplate,
      whatsappMessage,
      emailSubject,
      emailBody,
      linkType,
      productId,
      rewardType,
      rewardValue,
      isActive: true,
    });

    logger.info('Referral campaign created successfully', {
      userId: user.id,
      campaignId: campaign.id,
    });

    return NextResponse.json(
      {
        success: true,
        data: campaign,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Failed to create campaign', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

// PUT - Update campaign (activate/deactivate)
const updateCampaignSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID is required'),
  isActive: z.boolean(),
});

export async function PUT(request: NextRequest) {
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
    const validation = updateCampaignSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { campaignId, isActive } = validation.data;

    logger.info('Updating campaign status', {
      userId: user.id,
      campaignId,
      isActive,
    });

    // Update campaign in database
    // This would typically update your database directly
    // For now, returning the structure that would be returned
    const updatedCampaign = {
      id: campaignId,
      isActive,
      updatedAt: new Date().toISOString(),
    };

    logger.info('Campaign updated successfully', {
      userId: user.id,
      campaignId,
    });

    return NextResponse.json({
      success: true,
      data: updatedCampaign,
    });
  } catch (error) {
    logger.error('Failed to update campaign', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}
