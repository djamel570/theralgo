import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AlertService, type AlertPayload, type AlertLevel, type AlertChannel } from '../alerts';

// Mock the Supabase import
vi.mock('../supabase-server', () => ({
  createServiceSupabaseClient: vi.fn(),
}));

describe('AlertService', () => {
  let alertService: AlertService;
  let fetchMock: any;
  let supabaseMock: any;

  beforeEach(() => {
    alertService = new AlertService();

    // Mock fetch globally
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    global.fetch = fetchMock as any;

    // Mock Supabase client
    supabaseMock = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    };

    // Mock environment variables
    process.env.ALERT_WEBHOOK_URL = 'https://example.com/webhook/test';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('send with webhook channel', () => {
    it('should call webhook with critical alert', async () => {
      const payload: AlertPayload = {
        level: 'critical',
        title: 'Campaign Performance Critical',
        message: 'CPL has exceeded threshold by 200%',
        source: 'optimization_agent',
        campaign_id: 'campaign_123',
        therapist_name: 'Dr. Smith',
      };

      await alertService.send(payload, ['webhook']);

      // Verify fetch was called
      expect(fetchMock).toHaveBeenCalled();
      const callArgs = fetchMock.mock.calls[0];
      expect(callArgs[0]).toBe(process.env.ALERT_WEBHOOK_URL);
      expect(callArgs[1].method).toBe('POST');

      // Verify payload structure
      const body = JSON.parse(callArgs[1].body);
      expect(body.text).toContain('Campaign Performance Critical');
      expect(body.text).toContain('CPL has exceeded threshold by 200%');
      expect(body.blocks).toBeDefined();
    });

    it('should include emoji based on alert level in webhook', async () => {
      const levels: AlertLevel[] = ['info', 'warning', 'critical'];

      for (const level of levels) {
        const payload: AlertPayload = {
          level,
          title: `Test ${level} alert`,
          message: 'Test message',
          source: 'test_source',
        };

        await alertService.send(payload, ['webhook']);

        const callArgs = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
        const body = JSON.parse(callArgs[1].body);

        expect(body.text).toMatch(/ℹ️|⚠️|🚨/);
      }
    });

    it('should include therapist name in webhook message', async () => {
      const payload: AlertPayload = {
        level: 'warning',
        title: 'Therapist Update',
        message: 'New booking received',
        source: 'booking_system',
        therapist_name: 'Marie Dupont',
      };

      await alertService.send(payload, ['webhook']);

      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.text).toContain('Marie Dupont');
    });

    it('should handle details in webhook payload', async () => {
      const payload: AlertPayload = {
        level: 'warning',
        title: 'Ad Set Performance',
        message: 'CTR below threshold',
        source: 'optimization_agent',
        details: {
          adset_id: 'adset_123',
          ctr: 0.5,
          threshold: 0.8,
        },
      };

      await alertService.send(payload, ['webhook']);

      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      // Details should be in blocks as JSON
      expect(body.blocks.some((block: any) => block.type === 'section' && block.text?.text?.includes('adset_id'))).toBe(
        true
      );
    });

    it('should handle missing webhook URL gracefully', async () => {
      delete process.env.ALERT_WEBHOOK_URL;

      const payload: AlertPayload = {
        level: 'critical',
        title: 'Test',
        message: 'Test message',
        source: 'test',
      };

      // Should not throw
      await expect(alertService.send(payload, ['webhook'])).resolves.not.toThrow();

      // Fetch should not be called
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should handle webhook send errors gracefully', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const payload: AlertPayload = {
        level: 'critical',
        title: 'Test',
        message: 'Test message',
        source: 'test',
      };

      // Should not throw
      await expect(alertService.send(payload, ['webhook'])).resolves.not.toThrow();
    });
  });

  describe('send with database channel', () => {
    it('should save alert to Supabase database', async () => {
      const { createServiceSupabaseClient } = await import('../supabase-server');
      vi.mocked(createServiceSupabaseClient).mockReturnValue(supabaseMock);

      const payload: AlertPayload = {
        level: 'warning',
        title: 'Campaign Alert',
        message: 'Budget adjustment recommended',
        source: 'optimization_agent',
        campaign_id: 'campaign_456',
        therapist_name: 'Dr. Johnson',
        details: { budget_change: '+20%' },
      };

      await alertService.send(payload, ['database']);

      // Verify Supabase was called
      expect(supabaseMock.from).toHaveBeenCalledWith('alerts');
      const insertCall = supabaseMock.from().insert.mock.calls[0];
      const insertedData = insertCall[0];

      expect(insertedData.level).toBe('warning');
      expect(insertedData.title).toBe('Campaign Alert');
      expect(insertedData.message).toBe('Budget adjustment recommended');
      expect(insertedData.source).toBe('optimization_agent');
      expect(insertedData.campaign_id).toBe('campaign_456');
      expect(insertedData.therapist_name).toBe('Dr. Johnson');
      expect(insertedData.is_read).toBe(false);
      expect(insertedData.created_at).toBeDefined();
    });

    it('should include details in database save', async () => {
      const { createServiceSupabaseClient } = await import('../supabase-server');
      vi.mocked(createServiceSupabaseClient).mockReturnValue(supabaseMock);

      const payload: AlertPayload = {
        level: 'info',
        title: 'Sync Complete',
        message: 'Meta API sync finished',
        source: 'meta_sync',
        details: { records_synced: 150, duration_ms: 2340 },
      };

      await alertService.send(payload, ['database']);

      const insertCall = supabaseMock.from().insert.mock.calls[0];
      const insertedData = insertCall[0];

      expect(insertedData.details).toEqual({ records_synced: 150, duration_ms: 2340 });
    });

    it('should handle database errors gracefully', async () => {
      const { createServiceSupabaseClient } = await import('../supabase-server');
      const errorMock = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockRejectedValue(new Error('DB error')),
        }),
      };
      vi.mocked(createServiceSupabaseClient).mockReturnValue(errorMock);

      const payload: AlertPayload = {
        level: 'critical',
        title: 'Test',
        message: 'Test message',
        source: 'test',
      };

      // Should not throw
      await expect(alertService.send(payload, ['database'])).resolves.not.toThrow();
    });
  });

  describe('send with multiple channels', () => {
    it('should send to both webhook and database', async () => {
      const { createServiceSupabaseClient } = await import('../supabase-server');
      vi.mocked(createServiceSupabaseClient).mockReturnValue(supabaseMock);

      const payload: AlertPayload = {
        level: 'warning',
        title: 'Multi-channel Alert',
        message: 'Testing both channels',
        source: 'test_source',
      };

      await alertService.send(payload, ['webhook', 'database']);

      // Both should be called
      expect(fetchMock).toHaveBeenCalled();
      expect(supabaseMock.from).toHaveBeenCalledWith('alerts');
    });

    it('should default to webhook and database channels', async () => {
      const { createServiceSupabaseClient } = await import('../supabase-server');
      vi.mocked(createServiceSupabaseClient).mockReturnValue(supabaseMock);

      const payload: AlertPayload = {
        level: 'info',
        title: 'Default channels',
        message: 'Using default behavior',
        source: 'test',
      };

      await alertService.send(payload);

      // Both should be called when no channels specified
      expect(fetchMock).toHaveBeenCalled();
      expect(supabaseMock.from).toHaveBeenCalledWith('alerts');
    });

    it('should use Promise.allSettled to handle partial failures', async () => {
      const { createServiceSupabaseClient } = await import('../supabase-server');
      const partialFailureMock = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockRejectedValue(new Error('DB error')),
        }),
      };
      vi.mocked(createServiceSupabaseClient).mockReturnValue(partialFailureMock);

      fetchMock.mockResolvedValue({ ok: true });

      const payload: AlertPayload = {
        level: 'critical',
        title: 'Partial Failure Test',
        message: 'Webhook should succeed, DB should fail',
        source: 'test',
      };

      // Should not throw even though DB fails
      await expect(alertService.send(payload, ['webhook', 'database'])).resolves.not.toThrow();

      // Webhook should still be called
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  describe('Critical flag behavior', () => {
    it('should mark critical alerts with critical emoji in webhook', async () => {
      const payload: AlertPayload = {
        level: 'critical',
        title: 'CRITICAL: System Down',
        message: 'Database connection lost',
        source: 'system_monitor',
      };

      await alertService.send(payload, ['webhook']);

      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.text).toContain('🚨');
    });

    it('should include source metadata in critical alerts', async () => {
      const payload: AlertPayload = {
        level: 'critical',
        title: 'Critical Error',
        message: 'API rate limit exceeded',
        source: 'meta_api',
        campaign_id: 'camp_789',
      };

      await alertService.send(payload, ['webhook']);

      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      // Context block should include source
      expect(body.blocks.some((block: any) => block.type === 'context' && block.elements?.[0]?.text?.includes('meta_api'))).toBe(
        true
      );
    });
  });

  describe('Webhook URL validation', () => {
    it('should skip webhook if URL is not configured', async () => {
      process.env.ALERT_WEBHOOK_URL = '';

      const payload: AlertPayload = {
        level: 'warning',
        title: 'Test',
        message: 'Test message',
        source: 'test',
      };

      await alertService.send(payload, ['webhook']);

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should handle webhook URL with authentication', async () => {
      process.env.ALERT_WEBHOOK_URL = 'https://example.com/webhook/secure-test';

      const payload: AlertPayload = {
        level: 'info',
        title: 'Secure Alert',
        message: 'Should reach Slack',
        source: 'test',
      };

      await alertService.send(payload, ['webhook']);

      const callArgs = fetchMock.mock.calls[0];
      expect(callArgs[0]).toBe(process.env.ALERT_WEBHOOK_URL);
    });
  });

  describe('Alert payload structure', () => {
    it('should handle payload without optional fields', async () => {
      const { createServiceSupabaseClient } = await import('../supabase-server');
      vi.mocked(createServiceSupabaseClient).mockReturnValue(supabaseMock);

      const payload: AlertPayload = {
        level: 'info',
        title: 'Simple Alert',
        message: 'Minimal payload',
        source: 'test_source',
      };

      await alertService.send(payload, ['webhook', 'database']);

      // Both should work with minimal payload
      expect(fetchMock).toHaveBeenCalled();
      expect(supabaseMock.from).toHaveBeenCalledWith('alerts');
    });

    it('should handle large details objects in webhook', async () => {
      const largeDetails = {
        metrics: Array.from({ length: 50 }, (_, i) => ({
          timestamp: `2024-01-${String(i + 1).padStart(2, '0')}`,
          value: Math.random() * 100,
        })),
      };

      const payload: AlertPayload = {
        level: 'warning',
        title: 'Large Payload',
        message: 'Testing with large details',
        source: 'metrics',
        details: largeDetails,
      };

      await alertService.send(payload, ['webhook']);

      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      // Details should be truncated to 2000 chars per Slack limits
      const detailsBlock = body.blocks.find((b: any) => b.type === 'section' && b.text?.text?.includes('```'));
      if (detailsBlock) {
        expect(detailsBlock.text.text.length).toBeLessThanOrEqual(2050); // 2000 + overhead
      }
    });
  });

  describe('Export singleton', () => {
    it('should export a singleton alertService instance', async () => {
      const { alertService: imported } = await import('../alerts');
      expect(imported).toBeDefined();
      expect(imported).toBeInstanceOf(AlertService);
    });
  });
});
