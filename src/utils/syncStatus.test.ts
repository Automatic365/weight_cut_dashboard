import { describe, expect, it } from 'vitest';
import { deriveSyncFreshness, resolveLastLogDateIso } from './syncStatus';
import type { SyncMetadata } from '../types';

function buildMetadata(overrides: Partial<SyncMetadata> = {}): SyncMetadata {
  return {
    generatedAt: '2026-04-17T00:00:00.000Z',
    trigger: 'manual',
    source: 'local_file',
    remoteUrl: null,
    lastLogDate: '04/16',
    lastLogDateIso: '2026-04-16',
    totalDays: 1,
    ...overrides,
  };
}

describe('deriveSyncFreshness', () => {
  it('marks sync as fresh when under 24h old', () => {
    const sync = deriveSyncFreshness(
      buildMetadata({ generatedAt: '2026-04-17T00:00:00.000Z' }),
      new Date('2026-04-17T23:59:00.000Z'),
    );

    expect(sync.isStale).toBe(false);
    expect(sync.statusLabel).toBe('Fresh');
  });

  it('marks sync as stale when older than 24h', () => {
    const sync = deriveSyncFreshness(
      buildMetadata({ generatedAt: '2026-04-17T00:00:00.000Z' }),
      new Date('2026-04-18T00:01:00.000Z'),
    );

    expect(sync.isStale).toBe(true);
    expect(sync.statusLabel).toBe('Stale');
  });
});

describe('resolveLastLogDateIso', () => {
  it('uses canonical lastLogDateIso when valid', () => {
    const resolved = resolveLastLogDateIso({
      lastLogDate: '04/16',
      lastLogDateIso: '2026-04-16',
    });
    expect(resolved).toBe('2026-04-16');
  });

  it('falls back to mm/dd + fallback year when canonical date is missing', () => {
    const resolved = resolveLastLogDateIso({
      lastLogDate: '04/16',
      lastLogDateIso: null,
    }, 2027);
    expect(resolved).toBe('2027-04-16');
  });

  it('returns null when both canonical and fallback formats are invalid', () => {
    const resolved = resolveLastLogDateIso({
      lastLogDate: '13/99',
      lastLogDateIso: '2026-4-16',
    });
    expect(resolved).toBeNull();
  });
});
