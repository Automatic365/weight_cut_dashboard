import { describe, it, expect, vi } from 'vitest';
import { loadDashboardData } from './runtimeData';

const validData = [
  {
    date: '04/18',
    weight: 159.4,
    waistNavel: 30.7,
    waistPlus2: 30.5,
    waistMinus2: 31.0,
    tier: 'Linear',
    status: 'Pass',
    calories: 1950,
    protein: 185,
    sleep: 7.1,
    notes: '',
    isBossFight: false,
    bossName: null,
    upcomingBossName: null,
    shield: 6,
    streak: 8,
    adherenceScore: 90,
    attributes: {
      vitality: { level: 2, currentLvlXp: 10, nextLvlXp: 200, totalXp: 210 },
      discipline: { level: 4, currentLvlXp: 80, nextLvlXp: 400, totalXp: 680 },
      strength: { level: 5, currentLvlXp: 20, nextLvlXp: 500, totalXp: 1020 },
      resilience: { level: 2, currentLvlXp: 15, nextLvlXp: 200, totalXp: 215 },
    },
  },
];

const validMetadata = {
  generatedAt: '2026-04-22T00:00:00.000Z',
  trigger: 'schedule',
  source: 'remote_url',
  remoteUrl: 'https://raw.githubusercontent.com/Automatic365/daily_nutrition_logs/main/daily_log.md',
  lastLogDate: '04/18',
  lastLogDateIso: '2026-04-18',
  totalDays: 1,
} as const;

function okResponse(jsonValue: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => jsonValue,
  };
}

describe('loadDashboardData', () => {
  it('returns live source when runtime fetch succeeds with valid payloads', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(okResponse(validData))
      .mockResolvedValueOnce(okResponse(validMetadata));

    const result = await loadDashboardData({ fetchImpl: fetchImpl as unknown as typeof fetch, baseUrl: 'https://example.test/artifacts' });

    expect(result.dataSource).toBe('live');
    expect(result.data?.length).toBe(1);
    expect(result.syncMetadata?.lastLogDateIso).toBe('2026-04-18');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('falls back to local snapshot when runtime fetch fails', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network down'));
    const result = await loadDashboardData({ fetchImpl: fetchImpl as unknown as typeof fetch });

    expect(result.dataSource).toBe('fallback');
    expect(result.data).not.toBeNull();
    expect(result.syncMetadata).not.toBeNull();
    expect(result.errorMessage).toMatch(/network down/i);
  });

  it('returns error when runtime fetch and fallback both fail', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network down'));
    const result = await loadDashboardData({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      fallbackData: null,
      fallbackSyncMetadata: null,
    });

    expect(result.dataSource).toBe('error');
    expect(result.data).toBeNull();
    expect(result.syncMetadata).toBeNull();
    expect(result.errorMessage).toMatch(/network down/i);
  });
});
