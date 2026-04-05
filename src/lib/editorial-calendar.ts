import { createClient } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';
import {
  generateWeeklyBatch,
  getContentSuggestions,
  ContentBatch,
} from '@/lib/content-engine';
import { getSeasonalTopics, getKeywordsForTherapist, SEOKeyword } from '@/lib/seo-engine';
import { getVoiceProfile, VoiceProfile } from '@/lib/voice-dna';
import { createLaunchSequence, suggestProductContent } from '@/lib/product-content-bridge';

// Types
export interface CalendarWeek {
  id: string;
  therapistId: string;
  weekStart: Date;
  weekEnd: Date;
  weekNumber: number;
  year: number;
  weeklyTheme: string;
  themeRationale: string;
  targetIntention: string;
  seasonalHook: string;
  plannedContent: ContentSlot[];
  totalImpressions: number;
  totalEngagement: number;
  leadsGenerated: number;
  status: 'planned' | 'in_progress' | 'completed' | 'skipped';
  approvedByTherapist: boolean;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarMonth {
  therapistId: string;
  month: number;
  year: number;
  weeks: CalendarWeek[];
  themes: string[];
  narrativeArc: string;
  totalPlannedContent: number;
  stats: {
    projectedImpressions: number;
    projectedEngagement: number;
    projectedLeads: number;
  };
}

export interface WeekPlan {
  theme: string;
  rationale: string;
  seasonalHook: string;
  intention: string;
  slots: ContentSlot[];
  aiSuggestion: string;
}

export interface ContentSlot {
  day: string;
  platform: string;
  contentType: string;
  topic: string;
  status: 'scheduled' | 'in_production' | 'published' | 'skipped';
  scheduledFor: Date;
  seoKeywords?: string[];
  estimatedReadTime?: number;
  productId?: string;  // If this slot promotes a digital product
  productTitle?: string;
}

export interface WeekPerformance {
  weekId: string;
  impressions: number;
  engagement: number;
  leads: number;
  engagementRate: number;
  bestPerformingContent: {
    title: string;
    platform: string;
    engagement: number;
  } | null;
  worstPerformingContent: {
    title: string;
    platform: string;
    engagement: number;
  } | null;
  insights: string;
}

export interface ThemeAdjustmentSuggestion {
  suggestion: string;
  reason: string;
  alternativeTheme: string;
  expectedImpact: string;
}

// Constants
const PUBLISHING_SCHEDULE: Record<string, { platform: string; contentType: string; optimalTime: string }> = {
  Monday: {
    platform: 'Blog',
    contentType: 'Article',
    optimalTime: '09:00',
  },
  Tuesday: {
    platform: 'LinkedIn',
    contentType: 'Professional Post',
    optimalTime: '10:00',
  },
  Wednesday: {
    platform: 'Email',
    contentType: 'Newsletter',
    optimalTime: '14:00',
  },
  Thursday: {
    platform: 'Instagram',
    contentType: 'Carousel',
    optimalTime: '19:00',
  },
  Friday: {
    platform: 'TikTok/Instagram Reels',
    contentType: 'Short-form Video',
    optimalTime: '18:00',
  },
  Saturday: {
    platform: 'Google Business',
    contentType: 'Local Post',
    optimalTime: '10:00',
  },
  Sunday: {
    platform: 'Internal',
    contentType: 'Planning',
    optimalTime: null,
  },
};

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * Plan a full week of content with AI-driven theme selection
 */
export async function planWeek(therapistId: string, weekStart: Date): Promise<WeekPlan> {
  const supabase = createClient();
  const anthropic = new Anthropic();

  // Calculate week end date
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  // Get ISO week number
  const weekNumber = getISOWeekNumber(weekStart);
  const year = weekStart.getFullYear();

  // 1. Check recently used themes to avoid repetition
  const { data: recentWeeks } = await supabase
    .from('editorial_calendar')
    .select('weekly_theme')
    .eq('therapist_id', therapistId)
    .gte('week_start', new Date(weekStart.getFullYear(), weekStart.getMonth() - 2, 1))
    .order('week_start', { ascending: false })
    .limit(12);

  const recentThemes = (recentWeeks || []).map((w) => w.weekly_theme);

  // 2. Get seasonal topics for current month
  const seasonalTopics = await getSeasonalTopics(weekStart.getMonth() + 1, year);

  // 3. Get top-converting intentions and SEO keywords
  const keywords = await getKeywordsForTherapist(therapistId);
  const voiceProfile = await getVoiceProfile(therapistId);

  // 4. Get content suggestions for the week
  const contentSuggestions = await getContentSuggestions(therapistId, weekStart);

  // 5. Use Claude to select optimal theme and plan content
  const aiPrompt = `
Tu es un spécialiste en marketing de contenu pour les thérapeutes.
Théme récents utilisés (à éviter): ${recentThemes.join(', ')}
Thèmes saisonniers recommandés: ${seasonalTopics.join(', ')}
Mots-clés prioritaires: ${keywords.map((k: SEOKeyword) => k.keyword).join(', ')}
Profil vocal du thérapeute: ${voiceProfile?.voiceDescription || 'Professionnel et bienveillant'}
Suggestions de contenu: ${contentSuggestions.join(', ')}

Crée un plan de semaine cohérent pour ${new Date(weekStart).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}.

Fournis une réponse JSON avec:
{
  "theme": "Thème principal de la semaine",
  "rationale": "Justification du thème choisi",
  "seasonalHook": "Élément saisonnier ou opportun pour cette semaine",
  "intention": "Intention thérapeutique principale",
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
}
`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: aiPrompt,
      },
    ],
  });

  const aiResult = JSON.parse(
    response.content[0].type === 'text' ? response.content[0].text : '{}'
  );

  // 6. Create content slots with publishing schedule
  const contentSlots: ContentSlot[] = [];
  DAYS_OF_WEEK.forEach((day, index) => {
    if (index < 6) {
      // Skip Sunday (planning day)
      const schedule = PUBLISHING_SCHEDULE[day];
      const slotDate = new Date(weekStart);
      slotDate.setDate(slotDate.getDate() + index);

      const seoKeywordsForSlot =
        day === 'Monday' ? keywords.slice(0, 3).map((k: SEOKeyword) => k.keyword) : [];

      contentSlots.push({
        day,
        platform: schedule.platform,
        contentType: schedule.contentType,
        topic: aiResult.suggestions?.[index % aiResult.suggestions.length] || aiResult.theme,
        status: 'scheduled',
        scheduledFor: slotDate,
        seoKeywords: seoKeywordsForSlot,
        estimatedReadTime: day === 'Monday' ? 5 : undefined,
      });
    }
  });

  // Check for active digital products to feature this week
  const { data: activeProducts } = await supabase
    .from('digital_products')
    .select('id, title, type')
    .eq('therapist_id', therapistId)
    .eq('status', 'active');

  if (activeProducts && activeProducts.length > 0) {
    // Rotate through products weekly
    const weekIndex = weekNumber % activeProducts.length;
    const featuredProduct = activeProducts[weekIndex];

    // Find the Thursday slot (Instagram) and make it product-aware
    const thursdaySlot = contentSlots.find((s: any) => s.day === 'Thursday');
    if (thursdaySlot) {
      thursdaySlot.topic = `Contenu éducatif lié à "${featuredProduct.title}" — ${thursdaySlot.topic}`;
      thursdaySlot.productId = featuredProduct.id;
      thursdaySlot.productTitle = featuredProduct.title;
    }
  }

  // 7. Save to editorial_calendar table
  const { data: insertedWeek, error } = await supabase
    .from('editorial_calendar')
    .insert({
      therapist_id: therapistId,
      week_start: weekStart,
      week_number: weekNumber,
      year,
      weekly_theme: aiResult.theme,
      theme_rationale: aiResult.rationale,
      target_intention: aiResult.intention,
      seasonal_hook: aiResult.seasonalHook,
      planned_content: contentSlots,
      total_impressions: 0,
      total_engagement: 0,
      leads_generated: 0,
      status: 'planned',
      approved_by_therapist: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de la création du plan de semaine: ${error.message}`);
  }

  return {
    theme: aiResult.theme,
    rationale: aiResult.rationale,
    seasonalHook: aiResult.seasonalHook,
    intention: aiResult.intention,
    slots: contentSlots,
    aiSuggestion: `Plan de contenu créé pour la semaine du ${weekStart.toLocaleDateString('fr-FR')}`,
  };
}

/**
 * Plan 4-5 weeks for a full month with narrative arc
 */
export async function planMonth(
  therapistId: string,
  month: number,
  year: number
): Promise<CalendarMonth> {
  const supabase = createClient();
  const anthropic = new Anthropic();

  const weeks: CalendarWeek[] = [];
  const themes: string[] = [];

  // Get first day of month
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  // Plan each week in the month
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 7)) {
    const weekStart = new Date(d);
    if (weekStart.getMonth() !== month - 1) break;

    const weekPlan = await planWeek(therapistId, weekStart);
    themes.push(weekPlan.theme);

    // Fetch the created week from database
    const weekNumber = getISOWeekNumber(weekStart);
    const { data: weekData } = await supabase
      .from('editorial_calendar')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('week_number', weekNumber)
      .eq('year', year)
      .single();

    if (weekData) {
      weeks.push(mapDatabaseWeekToCalendarWeek(weekData));
    }
  }

  // Use Claude to create narrative arc
  const narrativePrompt = `
Tu es un expert en stratégie marketing pour les thérapeutes.
Voici les thèmes de contenu planifiés pour ${getMonthName(month)} ${year}:
${themes.map((t, i) => `Semaine ${i + 1}: ${t}`).join('\n')}

Crée un arc narratif cohérent qui lie ces thèmes ensemble et crée une progression logique pour le mois.
Explique comment ces thèmes se connectent et renforcent le message global.
`;

  const narrativeResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: narrativePrompt,
      },
    ],
  });

  const narrativeArc =
    narrativeResponse.content[0].type === 'text' ? narrativeResponse.content[0].text : '';

  // Calculate projected stats
  const stats = {
    projectedImpressions: weeks.reduce((sum, w) => sum + w.totalImpressions, 0),
    projectedEngagement: weeks.reduce((sum, w) => sum + w.totalEngagement, 0),
    projectedLeads: weeks.reduce((sum, w) => sum + w.leadsGenerated, 0),
  };

  return {
    therapistId,
    month,
    year,
    weeks,
    themes,
    narrativeArc,
    totalPlannedContent: weeks.reduce((sum, w) => sum + w.plannedContent.length, 0),
    stats,
  };
}

/**
 * Fetch calendar weeks from DB with content pieces joined
 */
export async function getCalendar(
  therapistId: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarWeek[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('editorial_calendar')
    .select(
      `
      *,
      content_pieces (
        id,
        title,
        platform,
        status,
        scheduled_for,
        content_type
      )
    `
    )
    .eq('therapist_id', therapistId)
    .gte('week_start', startDate)
    .lte('week_start', endDate)
    .order('week_start', { ascending: true });

  if (error) {
    throw new Error(`Erreur lors de la récupération du calendrier: ${error.message}`);
  }

  return (data || []).map(mapDatabaseWeekToCalendarWeek);
}

/**
 * Therapist approves a planned week → triggers content generation
 */
export async function approveWeek(therapistId: string, weekId: string): Promise<void> {
  const supabase = createClient();

  // Update week status
  const { error: updateError } = await supabase
    .from('editorial_calendar')
    .update({
      status: 'in_progress',
      approved_by_therapist: true,
      approved_at: new Date(),
    })
    .eq('id', weekId)
    .eq('therapist_id', therapistId);

  if (updateError) {
    throw new Error(`Erreur lors de l'approbation de la semaine: ${updateError.message}`);
  }

  // Fetch week details
  const { data: week, error: fetchError } = await supabase
    .from('editorial_calendar')
    .select('*')
    .eq('id', weekId)
    .single();

  if (fetchError || !week) {
    throw new Error('Semaine non trouvée');
  }

  // Trigger content generation
  const contentBatch = await generateWeeklyBatch(therapistId, week.planned_content, week.weekly_theme);

  // Create content pieces in database
  const contentPieces = contentBatch.pieces.map((piece) => ({
    therapist_id: therapistId,
    calendar_week_id: weekId,
    title: piece.title,
    content: piece.content,
    platform: piece.platform,
    content_type: piece.type,
    scheduled_for: piece.scheduledFor,
    status: 'in_production',
    seo_keywords: piece.keywords || [],
  }));

  const { error: insertError } = await supabase.from('content_pieces').insert(contentPieces);

  if (insertError) {
    throw new Error(`Erreur lors de la création du contenu: ${insertError.message}`);
  }
}

/**
 * Move a content piece to a different date
 */
export async function rescheduleContent(contentId: string, newDate: Date): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('content_pieces')
    .update({ scheduled_for: newDate })
    .eq('id', contentId);

  if (error) {
    throw new Error(`Erreur lors de la reprogrammation: ${error.message}`);
  }
}

/**
 * Mark a week as skipped (vacation, etc.)
 */
export async function skipWeek(
  therapistId: string,
  weekId: string,
  reason?: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('editorial_calendar')
    .update({
      status: 'skipped',
      theme_rationale: reason ? `Semaine ignorée: ${reason}` : 'Semaine ignorée',
    })
    .eq('id', weekId)
    .eq('therapist_id', therapistId);

  if (error) {
    throw new Error(`Erreur lors de l'abandon de la semaine: ${error.message}`);
  }
}

/**
 * Aggregate performance metrics for a week
 */
export async function getWeekPerformance(
  therapistId: string,
  weekId: string
): Promise<WeekPerformance> {
  const supabase = createClient();

  // Fetch week and related content pieces
  const { data: week, error: weekError } = await supabase
    .from('editorial_calendar')
    .select(
      `
      *,
      content_pieces (
        id,
        title,
        platform,
        views,
        engagement,
        leads_generated
      )
    `
    )
    .eq('id', weekId)
    .eq('therapist_id', therapistId)
    .single();

  if (weekError || !week) {
    throw new Error('Semaine non trouvée');
  }

  const contentPieces = week.content_pieces || [];

  // Calculate aggregated metrics
  const impressions = contentPieces.reduce((sum: number, p: any) => sum + (p.views || 0), 0);
  const engagement = contentPieces.reduce((sum: number, p: any) => sum + (p.engagement || 0), 0);
  const leads = contentPieces.reduce((sum: number, p: any) => sum + (p.leads_generated || 0), 0);

  const engagementRate = impressions > 0 ? (engagement / impressions) * 100 : 0;

  // Find best and worst performing content
  let bestPerformingContent = null;
  let worstPerformingContent = null;

  if (contentPieces.length > 0) {
    const sortedByEngagement = [...contentPieces].sort(
      (a: any, b: any) => (b.engagement || 0) - (a.engagement || 0)
    );
    bestPerformingContent = {
      title: sortedByEngagement[0].title,
      platform: sortedByEngagement[0].platform,
      engagement: sortedByEngagement[0].engagement,
    };
    worstPerformingContent = {
      title: sortedByEngagement[sortedByEngagement.length - 1].title,
      platform: sortedByEngagement[sortedByEngagement.length - 1].platform,
      engagement: sortedByEngagement[sortedByEngagement.length - 1].engagement,
    };
  }

  const insights = generatePerformanceInsights(
    engagementRate,
    bestPerformingContent,
    worstPerformingContent
  );

  return {
    weekId,
    impressions,
    engagement,
    leads,
    engagementRate,
    bestPerformingContent,
    worstPerformingContent,
    insights,
  };
}

/**
 * If a theme isn't performing, suggest pivoting
 */
export async function suggestThemeAdjustment(
  therapistId: string,
  weekId: string
): Promise<ThemeAdjustmentSuggestion> {
  const supabase = createClient();
  const anthropic = new Anthropic();

  // Get week performance data
  const performance = await getWeekPerformance(therapistId, weekId);

  // Fetch the week
  const { data: week } = await supabase
    .from('editorial_calendar')
    .select('*')
    .eq('id', weekId)
    .single();

  if (!week) {
    throw new Error('Semaine non trouvée');
  }

  // Use Claude to suggest theme adjustment
  const suggestionPrompt = `
Tu es un expert en marketing de contenu pour les thérapeutes.
La semaine suivante a des performances faibles:
- Thème: ${week.weekly_theme}
- Taux d'engagement: ${performance.engagementRate.toFixed(2)}%
- Impressions: ${performance.impressions}
- Contenu le plus performant: ${performance.bestPerformingContent?.title || 'N/A'}
- Contenu le moins performant: ${performance.worstPerformingContent?.title || 'N/A'}

Suggestions d'ajustement:
1. Propose un thème alternatif basé sur les performances
2. Explique pourquoi ce nouveau thème serait plus approprié
3. Prédis l'impact attendu

Réponds en JSON:
{
  "suggestion": "Thème alternatif proposé",
  "reason": "Justification détaillée",
  "expectedImpact": "Impact attendu sur les performances"
}
`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: suggestionPrompt,
      },
    ],
  });

  const suggestion = JSON.parse(
    response.content[0].type === 'text' ? response.content[0].text : '{}'
  );

  return {
    suggestion: suggestion.suggestion,
    reason: suggestion.reason,
    alternativeTheme: suggestion.suggestion,
    expectedImpact: suggestion.expectedImpact,
  };
}

// Helper functions

function getISOWeekNumber(date: Date): number {
  const target = new Date(date);
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.round((firstThursday - target.valueOf()) / 604800000);
}

function getMonthName(month: number): string {
  const monthNames = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];
  return monthNames[month - 1];
}

function mapDatabaseWeekToCalendarWeek(dbWeek: any): CalendarWeek {
  const weekEnd = new Date(dbWeek.week_start);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return {
    id: dbWeek.id,
    therapistId: dbWeek.therapist_id,
    weekStart: new Date(dbWeek.week_start),
    weekEnd,
    weekNumber: dbWeek.week_number,
    year: dbWeek.year,
    weeklyTheme: dbWeek.weekly_theme,
    themeRationale: dbWeek.theme_rationale,
    targetIntention: dbWeek.target_intention,
    seasonalHook: dbWeek.seasonal_hook,
    plannedContent: dbWeek.planned_content || [],
    totalImpressions: dbWeek.total_impressions || 0,
    totalEngagement: dbWeek.total_engagement || 0,
    leadsGenerated: dbWeek.leads_generated || 0,
    status: dbWeek.status,
    approvedByTherapist: dbWeek.approved_by_therapist,
    approvedAt: dbWeek.approved_at ? new Date(dbWeek.approved_at) : undefined,
    createdAt: new Date(dbWeek.created_at),
    updatedAt: new Date(dbWeek.updated_at),
  };
}

function generatePerformanceInsights(
  engagementRate: number,
  bestContent: any,
  worstContent: any
): string {
  let insights = '';

  if (engagementRate < 1) {
    insights = 'Le taux d\'engagement est très faible. Considérez un ajustement thématique.';
  } else if (engagementRate < 3) {
    insights = 'Le taux d\'engagement pourrait être amélioré. Analysez le contenu le moins performant.';
  } else if (engagementRate < 5) {
    insights = 'Engagement modéré. Continuez à tester et optimiser.';
  } else {
    insights = 'Excellent engagement! Reproduisez les éléments qui fonctionnent.';
  }

  if (bestContent && worstContent) {
    insights += ` Le contenu sur ${bestContent.platform} a surperformé, tandis que celui sur ${worstContent.platform} a underperformé.`;
  }

  return insights;
}

/**
 * Plan a product launch content sequence and integrate it into the editorial calendar
 */
export async function planProductLaunch(
  therapistId: string,
  productId: string,
  launchDate: Date
): Promise<{ launchSequence: any, calendarWeeks: CalendarWeek[] }> {
  const supabase = createClient();

  // Get the launch sequence from product-content-bridge
  const launchSequence = await createLaunchSequence(therapistId, productId, launchDate);

  // Create calendar entries for each phase
  const calendarWeeks: CalendarWeek[] = [];

  for (const phase of launchSequence.phases) {
    const phaseDate = new Date(launchDate);
    phaseDate.setDate(phaseDate.getDate() + (phase.weekOffset * 7));

    // Find Monday of that week
    const monday = new Date(phaseDate);
    monday.setDate(monday.getDate() - monday.getDay() + 1);

    const weekNumber = getISOWeekNumber(monday);

    const slots: ContentSlot[] = phase.contentPieces.map((piece: any) => ({
      day: piece.scheduledDay,
      platform: piece.contentType,
      contentType: piece.contentType,
      topic: piece.topic,
      status: 'scheduled' as const,
      scheduledFor: monday,
      productId: productId,
      productTitle: launchSequence.productTitle,
    }));

    const { data: calendarEntry } = await supabase
      .from('editorial_calendar')
      .upsert({
        therapist_id: therapistId,
        week_start: monday.toISOString().split('T')[0],
        week_number: weekNumber,
        year: monday.getFullYear(),
        weekly_theme: `🚀 Lancement : ${phase.name}`,
        theme_rationale: `Phase de lancement "${phase.theme}" pour ${launchSequence.productTitle}`,
        target_intention: 'product_launch',
        seasonal_hook: null,
        planned_content: JSON.stringify(slots),
        status: 'planned',
      }, { onConflict: 'therapist_id,week_start' })
      .select()
      .single();

    if (calendarEntry) {
      calendarWeeks.push(calendarEntry as unknown as CalendarWeek);
    }
  }

  return { launchSequence, calendarWeeks };
}
