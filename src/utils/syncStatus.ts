import { DATA_YEAR } from '../config';
import type { SyncMetadata } from '../types';

export const SYNC_STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [yearStr, monthStr, dayStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return false;

  const candidate = new Date(Date.UTC(year, month - 1, day));
  return (
    candidate.getUTCFullYear() === year
    && candidate.getUTCMonth() === month - 1
    && candidate.getUTCDate() === day
  );
}

function mmddToIso(value: string, fallbackYear: number): string | null {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  if (Number.isNaN(month) || Number.isNaN(day)) return null;

  const candidate = new Date(Date.UTC(fallbackYear, month - 1, day));
  if (
    candidate.getUTCFullYear() !== fallbackYear
    || candidate.getUTCMonth() !== month - 1
    || candidate.getUTCDate() !== day
  ) {
    return null;
  }

  return `${fallbackYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function resolveLastLogDateIso(
  syncInfo: Pick<SyncMetadata, 'lastLogDate' | 'lastLogDateIso'>,
  fallbackYear = DATA_YEAR,
): string | null {
  if (syncInfo.lastLogDateIso && isValidIsoDate(syncInfo.lastLogDateIso)) {
    return syncInfo.lastLogDateIso;
  }

  if (syncInfo.lastLogDate) {
    return mmddToIso(syncInfo.lastLogDate, fallbackYear);
  }

  return null;
}

function formatSyncTimestamp(generatedAt: string): string {
  const parsed = new Date(generatedAt);
  if (Number.isNaN(parsed.getTime())) return generatedAt;
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

export interface SyncFreshness {
  isStale: boolean;
  isValidTimestamp: boolean;
  statusLabel: 'Fresh' | 'Stale' | 'Unknown';
  syncTimestampLabel: string;
  lastLogDateIso: string | null;
}

export function deriveSyncFreshness(syncInfo: SyncMetadata, now = new Date()): SyncFreshness {
  const generatedAtDate = new Date(syncInfo.generatedAt);
  const isValidTimestamp = !Number.isNaN(generatedAtDate.getTime());
  const isStale = isValidTimestamp && (now.getTime() - generatedAtDate.getTime()) > SYNC_STALE_THRESHOLD_MS;

  return {
    isStale,
    isValidTimestamp,
    statusLabel: isValidTimestamp ? (isStale ? 'Stale' : 'Fresh') : 'Unknown',
    syncTimestampLabel: formatSyncTimestamp(syncInfo.generatedAt),
    lastLogDateIso: resolveLastLogDateIso(syncInfo),
  };
}
