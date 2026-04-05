import { createClient } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

// Types
export interface ContentMetrics {
  content_id: string;
  therapist_id: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  site_visits: number;
  leads_generated: number;
  bookings_generated: number;
  product_sales: number;
  organic_impressions: number;
  organic_clicks: number;
  avg_position: number;
  engagement_rate: number;
  conversion_rate: number;
  content_score: number;
  measured_at: string;
}

export interface ContentInsights {
  topPerformers: Array<{ id: string; title: string; score: number; views: number }>;
  worstPerformers: Array<{ id: string; title: string; score: number; views: number }>;
  bestContentType: { type: string; avgScore: number; count: number };
  bestTopic: { topic: string; avgScore: number; count: number };
  bestPostingTime: { hour: number; avgEngagement: number };
  recommendations: string[];
}

export interface PerformanceTrend {
  period: string;
  metric: string;
  values: number[];
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

export interface PaidOrganic {
  organicTopContent: Array<{ id: string; score: number }>;
  paidTopContent: Array<{ id: string; score: number }>;
  overlap: number;
  synergies: string[];
  recommendations: string[];
}

// Initialize Supabase and Anthropic clients
const supabase = createClient();
const anthropic = new Anthropic();

/**
 * Record and update metrics for a content piece
 * Recalculates engagement_rate, conversion_rate, and content_score
 */
export async function recordMetrics(
  contentId: string,
  metrics: Partial<ContentMetrics>
): Promise<void> {
  // Calculate engagement rate (likes, comments, shares relative to views)
  const engagement_rate = metrics.views && metrics.views > 0
    ? ((metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0)) / metrics.views
    : 0;

  // Calculate conversion rate (bookings relative to site visits)
  const conversion_rate = metrics.site_visits && metrics.site_visits > 0
    ? (metrics.bookings_generated || 0) / metrics.site_visits
    : 0;

  // Calculate content score: engagement 40%, conversion 40%, SEO 20%
  const seoScore = metrics.avg_position ? Math.max(0, 1 - (metrics.avg_position / 100)) : 0;
  const content_score =
    (engagement_rate * 0.4) + (conversion_rate * 0.4) + (seoScore * 0.2);

  const { error } = await supabase
    .from('content_analytics')
    .upsert({
      ...metrics,
      content_id: contentId,
      engagement_rate,
      conversion_rate,
      content_score,
      measured_at: new Date().toISOString(),
    }, {
      onConflict: 'content_id',
    });

  if (error) throw error;
}

/**
 * Get comprehensive content insights for a period
 */
export async function getContentInsights(
  therapistId: string,
  period: '7d' | '30d' | '90d'
): Promise<ContentInsights> {
  const daysAgo = { '7d': 7, '30d': 30, '90d': 90 }[period];
  const dateFilter = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

  // Get all analytics for the period
  const { data: analytics, error: analyticsError } = await supabase
    .from('content_analytics')
    .select(`
      content_id,
      views,
      engagement_rate,
      conversion_rate,
      content_score,
      content_pieces:content_id(content_type, target_intention, published_at)
    `)
    .eq('therapist_id', therapistId)
    .gte('measured_at', dateFilter);

  if (analyticsError) throw analyticsError;

  // Get content details for top/worst performers
  const { data: contentPieces } = await supabase
    .from('content_pieces')
    .select('id, title, content_type, target_intention')
    .eq('therapist_id', therapistId)
    .gte('published_at', dateFilter);

  // Sort by content_score
  const sorted = (analytics || [])
    .sort((a, b) => (b.content_score || 0) - (a.content_score || 0));

  const topPerformers = sorted.slice(0, 5).map(a => ({
    id: a.content_id,
    title: contentPieces?.find(c => c.id === a.content_id)?.title || 'Unknown',
    score: a.content_score || 0,
    views: a.views || 0,
  }));

  const worstPerformers = sorted.slice(-5).reverse().map(a => ({
    id: a.content_id,
    title: contentPieces?.find(c => c.id === a.content_id)?.title || 'Unknown',
    score: a.content_score || 0,
    views: a.views || 0,
  }));

  // Best content type
  const byType = (analytics || []).reduce((acc, a) => {
    const type = (a.content_pieces as any)?.content_type || 'unknown';
    if (!acc[type]) acc[type] = { scores: [], count: 0 };
    acc[type].scores.push(a.content_score || 0);
    acc[type].count++;
    return acc;
  }, {} as Record<string, { scores: number[]; count: number }>);

  const bestContentType = Object.entries(byType)
    .map(([type, data]) => ({
      type,
      avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      count: data.count,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)[0] || {
    type: 'unknown',
    avgScore: 0,
    count: 0,
  };

  // Best topic
  const byTopic = (analytics || []).reduce((acc, a) => {
    const topic = (a.content_pieces as any)?.target_intention || 'unknown';
    if (!acc[topic]) acc[topic] = { scores: [], count: 0 };
    acc[topic].scores.push(a.content_score || 0);
    acc[topic].count++;
    return acc;
  }, {} as Record<string, { scores: number[]; count: number }>);

  const bestTopic = Object.entries(byTopic)
    .map(([topic, data]) => ({
      topic,
      avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      count: data.count,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)[0] || {
    topic: 'unknown',
    avgScore: 0,
    count: 0,
  };

  // Best posting time (simplified: extract hour from published_at)
  const byHour = (analytics || []).reduce((acc, a) => {
    const hour = new Date((a.content_pieces as any)?.published_at || new Date()).getHours();
    if (!acc[hour]) acc[hour] = [];
    acc[hour].push(a.engagement_rate || 0);
    return acc;
  }, {} as Record<number, number[]>);

  const bestPostingTime = Object.entries(byHour)
    .map(([hour, rates]) => ({
      hour: parseInt(hour),
      avgEngagement: rates.reduce((a, b) => a + b, 0) / rates.length,
    }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)[0] || {
    hour: 9,
    avgEngagement: 0,
  };

  // Generate AI recommendations
  const recommendations = await generateRecommendations(
    therapistId,
    topPerformers,
    bestContentType,
    bestTopic
  );

  return {
    topPerformers,
    worstPerformers,
    bestContentType,
    bestTopic,
    bestPostingTime,
    recommendations,
  };
}

/**
 * Get performance trends for a metric over time
 */
export async function getPerformanceTrends(
  therapistId: string,
  metric: 'engagement_rate' | 'conversion_rate' | 'content_score' | 'views',
  periods: number = 4
): Promise<PerformanceTrend> {
  const { data, error } = await supabase
    .from('content_analytics')
    .select(metric, 'measured_at')
    .eq('therapist_id', therapistId)
    .order('measured_at', { ascending: true });

  if (error) throw error;

  // Group by week
  const weeks: Record<string, number[]> = {};
  (data || []).forEach((row) => {
    const date = new Date(row.measured_at);
    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const key = weekStart.toISOString().split('T')[0];
    if (!weeks[key]) weeks[key] = [];
    weeks[key].push(row[metric as keyof typeof row] || 0);
  });

  const values = Object.values(weeks)
    .slice(-periods)
    .map(v => v.reduce((a, b) => a + b, 0) / v.length);

  // Calculate trend
  const trend =
    values.length < 2
      ? 'stable'
      : values[values.length - 1] > values[0] * 1.05
      ? 'up'
      : values[values.length - 1] < values[0] * 0.95
      ? 'down'
      : 'stable';

  const changePercent =
    values.length < 2
      ? 0
      : ((values[values.length - 1] - values[0]) / values[0]) * 100;

  return {
    period: `Last ${periods} weeks`,
    metric,
    values,
    trend,
    changePercent,
  };
}

/**
 * Analyze paid vs organic content synergy
 */
export async function analyzePaidOrganicSynergy(therapistId: string): Promise<PaidOrganic> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: analytics } = await supabase
    .from('content_analytics')
    .select(`
      content_id,
      content_score,
      organic_impressions,
      organic_clicks,
      clicks,
      content_pieces:content_id(is_paid)
    `)
    .eq('therapist_id', therapistId)
    .gte('measured_at', thirtyDaysAgo);

  const organic = (analytics || [])
    .filter(a => !(a.content_pieces as any)?.is_paid)
    .sort((a, b) => (b.content_score || 0) - (a.content_score || 0))
    .slice(0, 5)
    .map(a => ({ id: a.content_id, score: a.content_score || 0 }));

  const paid = (analytics || [])
    .filter(a => (a.content_pieces as any)?.is_paid)
    .sort((a, b) => (b.content_score || 0) - (a.content_score || 0))
    .slice(0, 5)
    .map(a => ({ id: a.content_id, score: a.content_score || 0 }));

  const overlap = organic.filter(o => paid.some(p => p.id === o.id)).length;

  return {
    organicTopContent: organic,
    paidTopContent: paid,
    overlap,
    synergies: [
      'Les contenus organiques performants peuvent être amplifiés via publicités payantes',
      'Les données d\'audience des campagnes payantes informent la stratégie organique',
      'Créer des audiences lookalike basées sur les followers de contenu performant',
    ],
    recommendations: [
      overlap === 0 ? 'Peu de chevauchement: explorer les audiences complémentaires' : '',
      organic.length > 0
        ? `Boosters organiques: ${organic.slice(0, 2).map(o => o.id).join(', ')}`
        : '',
    ].filter(Boolean),
  };
}

/**
 * Get top performing topics
 */
export async function getTopPerformingTopics(
  therapistId: string,
  limit: number = 10
): Promise<Array<{ topic: string; avgScore: number; count: number }>> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('content_analytics')
    .select(`
      content_score,
      content_pieces:content_id(target_intention)
    `)
    .eq('therapist_id', therapistId)
    .gte('measured_at', thirtyDaysAgo);

  const byTopic = (data || []).reduce((acc, a) => {
    const topic = (a.content_pieces as any)?.target_intention || 'unknown';
    if (!acc[topic]) acc[topic] = { scores: [] };
    acc[topic].scores.push(a.content_score || 0);
    return acc;
  }, {} as Record<string, { scores: number[] }>);

  return Object.entries(byTopic)
    .map(([topic, data]) => ({
      topic,
      avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      count: data.scores.length,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, limit);
}

/**
 * Get top performing formats
 */
export async function getTopPerformingFormats(
  therapistId: string
): Promise<Array<{ contentType: string; avgEngagement: number; avgConversion: number }>> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('content_analytics')
    .select(`
      engagement_rate,
      conversion_rate,
      content_pieces:content_id(content_type)
    `)
    .eq('therapist_id', therapistId)
    .gte('measured_at', thirtyDaysAgo);

  const byType = (data || []).reduce((acc, a) => {
    const type = (a.content_pieces as any)?.content_type || 'unknown';
    if (!acc[type]) acc[type] = { engagement: [], conversion: [] };
    acc[type].engagement.push(a.engagement_rate || 0);
    acc[type].conversion.push(a.conversion_rate || 0);
    return acc;
  }, {} as Record<string, { engagement: number[]; conversion: number[] }>);

  return Object.entries(byType)
    .map(([contentType, data]) => ({
      contentType,
      avgEngagement: data.engagement.reduce((a, b) => a + b, 0) / data.engagement.length,
      avgConversion: data.conversion.reduce((a, b) => a + b, 0) / data.conversion.length,
    }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement);
}

/**
 * Generate AI performance report in French
 */
export async function generatePerformanceReport(
  therapistId: string,
  period: '7d' | '30d'
): Promise<{ summary: string; highlights: string[]; actions: string[] }> {
  const insights = await getContentInsights(therapistId, period);

  const prompt = `Vous êtes un expert en marketing pour les thérapeutes. Analysez ces données de performance de contenu et générez un rapport en français.

Performances principales:
- Type de contenu meilleur: ${insights.bestContentType.type} (score: ${insights.bestContentType.avgScore.toFixed(2)})
- Meilleur sujet: ${insights.bestTopic.topic} (score: ${insights.bestTopic.avgScore.toFixed(2)})
- Meilleure heure: ${insights.bestPostingTime.hour}h

Top 3 contenus:
${insights.topPerformers.slice(0, 3).map(p => `- ${p.title}: ${p.views} vues, score ${p.score.toFixed(2)}`).join('\n')}

Générez un rapport JSON avec:
{
  "summary": "Un paragraphe résumant les performances",
  "highlights": ["point clé 1", "point clé 2", "point clé 3"],
  "actions": ["Action recommandée 1", "Action recommandée 2", "Action recommandée 3"]
}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse response');

  const report = JSON.parse(jsonMatch[0]);
  return report;
}

/**
 * THE KEY FUNCTION: Compute weights for the Content Engine
 * Analyzes historical performance and returns weighted preferences
 */
export async function feedbackLoop(
  therapistId: string
): Promise<{
  contentTypeWeights: Record<string, number>;
  topicWeights: Record<string, number>;
  timeWeights: Record<string, number>;
}> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data: analytics } = await supabase
    .from('content_analytics')
    .select(`
      content_score,
      measured_at,
      content_pieces:content_id(content_type, target_intention, published_at)
    `)
    .eq('therapist_id', therapistId)
    .gte('measured_at', ninetyDaysAgo);

  // Calculate content type weights
  const typeScores: Record<string, number[]> = {};
  (analytics || []).forEach(a => {
    const type = (a.content_pieces as any)?.content_type || 'unknown';
    if (!typeScores[type]) typeScores[type] = [];
    typeScores[type].push(a.content_score || 0);
  });

  const contentTypeWeights = Object.entries(typeScores).reduce((acc, [type, scores]) => {
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    acc[type] = avgScore / 100; // Normalize
    return acc;
  }, {} as Record<string, number>);

  // Calculate topic weights
  const topicScores: Record<string, number[]> = {};
  (analytics || []).forEach(a => {
    const topic = (a.content_pieces as any)?.target_intention || 'unknown';
    if (!topicScores[topic]) topicScores[topic] = [];
    topicScores[topic].push(a.content_score || 0);
  });

  const topicWeights = Object.entries(topicScores).reduce((acc, [topic, scores]) => {
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    acc[topic] = avgScore / 100; // Normalize
    return acc;
  }, {} as Record<string, number>);

  // Calculate time weights (hour of day)
  const timeScores: Record<number, number[]> = {};
  (analytics || []).forEach(a => {
    const hour = new Date((a.content_pieces as any)?.published_at || new Date()).getHours();
    if (!timeScores[hour]) timeScores[hour] = [];
    timeScores[hour].push(a.content_score || 0);
  });

  const timeWeights = Object.entries(timeScores).reduce((acc, [hour, scores]) => {
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    acc[`${hour}h`] = avgScore / 100; // Normalize
    return acc;
  }, {} as Record<string, number>);

  return {
    contentTypeWeights,
    topicWeights,
    timeWeights,
  };
}

/**
 * Helper: Generate AI recommendations
 */
async function generateRecommendations(
  therapistId: string,
  topPerformers: Array<{ id: string; title: string; score: number }>,
  bestContentType: { type: string; avgScore: number },
  bestTopic: { topic: string; avgScore: number }
): Promise<string[]> {
  const prompt = `Vous êtes un expert en marketing pour les thérapeutes. Basé sur ces données de performance, fournissez 3 recommandations courtes en français.

Type de contenu performant: ${bestContentType.type}
Sujet performant: ${bestTopic.topic}
Top contenu: ${topPerformers.slice(0, 2).map(p => p.title).join(', ')}

Fournissez exactement 3 recommandations sous forme de liste JSON simple: ["rec1", "rec2", "rec3"]`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') return [];

  try {
    const match = content.text.match(/\[[\s\S]*\]/);
    if (match) {
      const recs = JSON.parse(match[0]);
      return Array.isArray(recs) ? recs : [];
    }
  } catch {
    return [];
  }

  return [];
}
