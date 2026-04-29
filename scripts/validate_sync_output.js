import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const dataPath = path.resolve(repoRoot, 'src/data.json');
const metadataPath = path.resolve(repoRoot, 'src/sync-metadata.json');

function isValidIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
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

function parseJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function appendStepSummary(markdown) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    fs.appendFileSync(summaryPath, `${markdown}\n`);
  }
}

function appendOutput(name, value) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (outputPath) {
    fs.appendFileSync(outputPath, `${name}=${value}\n`);
  }
}

function isoToDate(value) {
  return new Date(`${value}T00:00:00Z`);
}

function mmddToIso(value, year) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(candidate.getTime())
    || candidate.getUTCMonth() !== month - 1
    || candidate.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function inferDataYear(data, metadata) {
  const lastIso = metadata?.lastLogDateIso;
  if (isValidIsoDate(lastIso)) return Number(lastIso.slice(0, 4));
  const generatedAtYear = metadata?.generatedAt ? new Date(metadata.generatedAt).getUTCFullYear() : null;
  if (Number.isInteger(generatedAtYear)) return generatedAtYear;
  return new Date().getUTCFullYear();
}

function isFastDay(entry) {
  if (entry?.isFast === true) return true;
  if (entry?.parseVerification?.isFastDay === true) return true;
  return entry?.tier === 'Tier 3' && entry?.calories === 0 && entry?.protein === 0;
}

function findRecentMissingDates(data, metadata, maxLookbackDays = 14) {
  if (!Array.isArray(data) || data.length === 0 || !isValidIsoDate(metadata?.lastLogDateIso)) return [];

  const year = inferDataYear(data, metadata);
  const present = new Set(
    data
      .map((entry) => mmddToIso(entry?.date, year))
      .filter(Boolean)
  );

  const last = isoToDate(metadata.lastLogDateIso);
  const firstRecent = new Date(last);
  firstRecent.setUTCDate(last.getUTCDate() - Math.min(maxLookbackDays - 1, data.length - 1));

  const missing = [];
  for (const cursor = new Date(firstRecent); cursor <= last; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const iso = cursor.toISOString().slice(0, 10);
    if (!present.has(iso)) missing.push(iso);
  }
  return missing;
}

function main() {
  const errors = [];
  const warnings = [];

  let data = null;
  let metadata = null;

  try {
    data = parseJsonFile(dataPath);
  } catch (err) {
    errors.push(`Unable to parse src/data.json: ${err.message}`);
  }

  try {
    metadata = parseJsonFile(metadataPath);
  } catch (err) {
    errors.push(`Unable to parse src/sync-metadata.json: ${err.message}`);
  }

  if (data && !Array.isArray(data)) {
    errors.push('src/data.json must be an array.');
  }
  if (Array.isArray(data) && data.length === 0) {
    errors.push('src/data.json must contain at least one entry.');
  }

  if (metadata && (typeof metadata !== 'object' || metadata == null)) {
    errors.push('src/sync-metadata.json must be an object.');
  }

  const generatedAt = metadata?.generatedAt;
  const generatedAtDate = generatedAt ? new Date(generatedAt) : null;
  if (!generatedAt || Number.isNaN(generatedAtDate?.getTime?.())) {
    errors.push('sync-metadata.generatedAt must be a valid ISO timestamp.');
  }

  if (!Number.isInteger(metadata?.totalDays) || metadata.totalDays <= 0) {
    errors.push('sync-metadata.totalDays must be a positive integer.');
  }

  if (Array.isArray(data) && Number.isInteger(metadata?.totalDays) && metadata.totalDays !== data.length) {
    errors.push(`sync-metadata.totalDays (${metadata.totalDays}) does not match data length (${data.length}).`);
  }

  if (Array.isArray(data)) {
    const zeroProteinNonFast = data.filter((entry) => entry?.protein === 0 && !isFastDay(entry));
    if (zeroProteinNonFast.length > 0) {
      errors.push(`Found 0g protein on non-fast day(s): ${zeroProteinNonFast.map((entry) => entry.date ?? 'unknown').join(', ')}.`);
    }
  }

  if (metadata && !('lastLogDateIso' in metadata)) {
    errors.push('sync-metadata.lastLogDateIso is required (nullable).');
  } else if (metadata?.lastLogDateIso != null && !isValidIsoDate(metadata.lastLogDateIso)) {
    errors.push(`sync-metadata.lastLogDateIso is invalid: ${metadata.lastLogDateIso}`);
  }

  const now = process.env.SYNC_VALIDATION_NOW ? new Date(process.env.SYNC_VALIDATION_NOW) : new Date();
  const syncAgeMs = generatedAtDate ? now.getTime() - generatedAtDate.getTime() : null;
  const syncIsStale = syncAgeMs != null && syncAgeMs > STALE_THRESHOLD_MS;
  if (syncIsStale) {
    const ageHours = Math.floor(syncAgeMs / (60 * 60 * 1000));
    warnings.push(`Sync is older than 24h (${ageHours}h old). This is a warning only.`);
  }

  const lastLogDateIso = metadata?.lastLogDateIso ?? null;
  if (lastLogDateIso) {
    const lastLog = new Date(`${lastLogDateIso}T00:00:00Z`);
    const dayAge = Math.floor((now.getTime() - lastLog.getTime()) / (24 * 60 * 60 * 1000));
    if (dayAge > 1) {
      warnings.push(`Last upstream log date is ${lastLogDateIso} (${dayAge} days old).`);
    }
  } else {
    warnings.push('lastLogDateIso is null; cannot determine upstream recency.');
  }

  const recentMissingDates = findRecentMissingDates(data, metadata);
  if (recentMissingDates.length > 0) {
    warnings.push(`Missing recent calendar day(s) in parsed data: ${recentMissingDates.join(', ')}. Add exact day headers or confirm no log exists.`);
  }

  if (warnings.length > 0) {
    for (const warning of warnings) {
      console.warn(`WARN: ${warning}`);
    }
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`ERROR: ${error}`);
    }
    appendStepSummary([
      '### Sync Validation',
      '',
      'Validation failed.',
      '',
      ...errors.map((e) => `- ERROR: ${e}`),
      ...warnings.map((w) => `- WARN: ${w}`),
    ].join('\n'));
    process.exit(1);
  }

  const generatedAtDisplay = generatedAtDate.toISOString();
  const lastLogDateDisplay = metadata?.lastLogDate ?? 'n/a';
  const totalDays = metadata?.totalDays ?? 0;

  appendOutput('sync_generated_at', generatedAtDisplay);
  appendOutput('sync_last_log_date', lastLogDateDisplay);
  appendOutput('sync_total_days', String(totalDays));
  appendOutput('sync_is_stale', String(syncIsStale));

  appendStepSummary([
    '### Sync Validation',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| Generated At | ${generatedAtDisplay} |`,
    `| Last Log Date | ${lastLogDateDisplay} |`,
    `| Last Log Date ISO | ${lastLogDateIso ?? 'n/a'} |`,
    `| Total Days | ${totalDays} |`,
    `| Sync Age Status | ${syncIsStale ? 'stale (>24h, warning)' : 'fresh (<=24h)'} |`,
    '',
    ...warnings.map((w) => `- WARN: ${w}`),
  ].join('\n'));

  console.log(`Sync validation passed. totalDays=${totalDays} generatedAt=${generatedAtDisplay}`);
}

main();
