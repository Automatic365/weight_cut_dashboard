import fallbackData from '../data.json';
import fallbackSyncMetadata from '../sync-metadata.json';
import type { DashboardDataLoadResult, DayEntry, SyncMetadata } from '../types';

const DEFAULT_DATA_BASE_URL = 'https://raw.githubusercontent.com/Automatic365/weight_cut_dashboard/data/artifacts';

function getDataBaseUrl(explicitBaseUrl?: string): string {
  const configured = explicitBaseUrl ?? import.meta.env.VITE_DATA_BASE_URL ?? DEFAULT_DATA_BASE_URL;
  return configured.replace(/\/+$/, '');
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null;
}

function isDayEntryArray(value: unknown): value is DayEntry[] {
  return Array.isArray(value) && value.length > 0;
}

function isSyncMetadata(value: unknown): value is SyncMetadata {
  return isObject(value)
    && typeof value.generatedAt === 'string'
    && typeof value.trigger === 'string'
    && typeof value.source === 'string'
    && (typeof value.remoteUrl === 'string' || value.remoteUrl === null)
    && (typeof value.lastLogDate === 'string' || value.lastLogDate === null)
    && (value.lastLogDateIso == null || typeof value.lastLogDateIso === 'string')
    && Number.isInteger(value.totalDays);
}

function readFallbackSnapshot(
  fallbackDataValue: unknown = fallbackData,
  fallbackMetadataValue: unknown = fallbackSyncMetadata,
): { data: DayEntry[]; syncMetadata: SyncMetadata } | null {
  if (!isDayEntryArray(fallbackDataValue) || !isSyncMetadata(fallbackMetadataValue)) return null;
  return {
    data: fallbackDataValue as DayEntry[],
    syncMetadata: fallbackMetadataValue as SyncMetadata,
  };
}

export interface LoadDashboardDataOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  fallbackData?: unknown;
  fallbackSyncMetadata?: unknown;
}

export async function loadDashboardData(
  options: LoadDashboardDataOptions = {},
): Promise<DashboardDataLoadResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = getDataBaseUrl(options.baseUrl);
  const dataUrl = `${baseUrl}/data.json`;
  const metadataUrl = `${baseUrl}/sync-metadata.json`;

  try {
    const [dataResponse, metadataResponse] = await Promise.all([
      fetchImpl(dataUrl, { cache: 'no-store' }),
      fetchImpl(metadataUrl, { cache: 'no-store' }),
    ]);

    if (!dataResponse.ok) {
      throw new Error(`Data fetch failed (${dataResponse.status})`);
    }
    if (!metadataResponse.ok) {
      throw new Error(`Metadata fetch failed (${metadataResponse.status})`);
    }

    const [remoteData, remoteMetadata] = await Promise.all([
      dataResponse.json(),
      metadataResponse.json(),
    ]);

    if (!isDayEntryArray(remoteData)) {
      throw new Error('Remote data payload is invalid.');
    }
    if (!isSyncMetadata(remoteMetadata)) {
      throw new Error('Remote metadata payload is invalid.');
    }

    return {
      dataSource: 'live',
      dataUrl: baseUrl,
      data: remoteData,
      syncMetadata: remoteMetadata,
    };
  } catch (err) {
    const fallback = readFallbackSnapshot(options.fallbackData, options.fallbackSyncMetadata);
    const errorMessage = err instanceof Error ? err.message : 'Unknown runtime data error.';

    if (fallback) {
      return {
        dataSource: 'fallback',
        dataUrl: baseUrl,
        errorMessage,
        data: fallback.data,
        syncMetadata: fallback.syncMetadata,
      };
    }

    return {
      dataSource: 'error',
      dataUrl: baseUrl,
      errorMessage,
      data: null,
      syncMetadata: null,
    };
  }
}
