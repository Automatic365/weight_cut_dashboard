import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import {
  MAX_SHIELD, SHIELD_OVEREAT_THRESHOLD, SHIELD_DAMAGE_DENOMINATOR,
  SLEEP_GOAL, SLEEP_POOR_PENALTY_THRESHOLD, ADHERENCE_HIGH, ADHERENCE_LOW,
  PROTEIN_FLOOR, XP,
} from '../src/config.js';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseLabeledValue(text, label) {
  const pattern = new RegExp(`(?:^|\\n)\\s*(?:[-*]\\s*)?(?:\\*\\*)?${label}(?:\\*\\*)?:\\s*([^\\n]+)`, 'i');
  const match = text.match(pattern);
  return match ? match[1].trim() : null;
}

function normalizeNullableValue(value) {
  if (!value) return null;
  const cleaned = value.replace(/\*\*/g, '').trim();
  if (/^(null|none|n\/a|na)$/i.test(cleaned)) return null;
  return cleaned;
}

function parseAdherencePercentFromLine(valueText) {
  const normalized = valueText.replace(/\*\*/g, '').trim();
  const rangeMatch = normalized.match(/(\d{2,3})\D+(\d{2,3})\s*%/);
  if (rangeMatch) {
    const low = parseInt(rangeMatch[1], 10);
    const high = parseInt(rangeMatch[2], 10);
    if (!Number.isNaN(low) && !Number.isNaN(high)) {
      return Math.round((low + high) / 2);
    }
  }

  const pctMatch = normalized.match(/(\d{2,3})\s*%/);
  if (pctMatch) {
    const pct = parseInt(pctMatch[1], 10);
    if (!Number.isNaN(pct)) return pct;
  }

  return null;
}

function buildExecutionText(dayText) {
  const futureSectionHeading = /(forward plan|reality plan|tomorrow|next expected input|next day note|what to expect tomorrow|tomorrow plan|tomorrow priority|tomorrow directive|tomorrow preview|forecast|preview)/i;
  const explicitPlanningLine = /\b(upcoming|forward plan|reality plan|forecast|preview|tomorrow)\b/i;
  const lines = dayText.split('\n');
  const keptLines = [];
  let inFutureSection = false;

  for (const line of lines) {
    const headingMatch = line.match(/^###\s+(.+)$/);
    if (headingMatch) {
      if (futureSectionHeading.test(headingMatch[1])) {
        inFutureSection = true;
        continue;
      }
      inFutureSection = false;
    }

    if (inFutureSection) continue;
    if (explicitPlanningLine.test(line)) continue;
    keptLines.push(line);
  }

  return keptLines.join('\n');
}

function parseProteinValue(text, re) {
  const m = text.match(re);
  if (!m) return null;
  const lo = parseInt(m[1], 10);
  const hi = m[2] ? parseInt(m[2], 10) : lo;
  if (Number.isNaN(lo) || Number.isNaN(hi)) return null;
  return Math.round((lo + hi) / 2);
}

function parseRawDailyProtein(dayText) {
  const reportedBlock = parseProteinValue(
    dayText,
    /Reported Intake[\s\S]{0,260}?Protein:\s*\*{0,2}\s*~?([0-9]+)(?:\s*[–\-]\s*([0-9]+))?\s*g/i
  );
  if (reportedBlock != null) return reportedBlock;

  const loggedBlock = parseProteinValue(
    dayText,
    /Logged intake[\s\S]{0,260}?Protein:\s*\*{0,2}\s*~?([0-9]+)(?:\s*[–\-]\s*([0-9]+))?\s*g/i
  );
  if (loggedBlock != null) return loggedBlock;

  const totalsBlock = parseProteinValue(
    dayText,
    /(?:Daily Intake Totals|Totals?)[\s\S]{0,320}?Protein:\s*\*{0,2}\s*~?([0-9]+)(?:\s*[–\-]\s*([0-9]+))?\s*g/i
  );
  if (totalsBlock != null) return totalsBlock;

  return null;
}

function getLevelInfo(totalXp) {
  let safeXp = totalXp;
  if (safeXp < 0) safeXp = 0;

  let level = 1;
  let xpRequired = level * 100;
  let remainingXp = safeXp;

  while (remainingXp >= xpRequired) {
    remainingXp -= xpRequired;
    level++;
    xpRequired = level * 100;
  }

  return { level, currentLvlXp: remainingXp, nextLvlXp: xpRequired };
}

// Extract the structured "### App Parse Block" section appended by the AI coach.
// Returns the block text if present, or null. Used as the primary data source —
// fields found here are authoritative; body-text regex serves as fallback only.
function extractAppParseBlock(dayText) {
  // Match "### App Parse Block" (with heading) or plain "App Parse Block" (without).
  // No 'm' flag: $ = end of string, so non-greedy capture extends to end of day block correctly.
  const match = dayText.match(/(?:^|\n)(?:#{1,3}\s*)?App Parse Block\s*\n([\s\S]*?)(?=\n#{1,3}\s|\n## \d{4}|$)/i);
  return match ? match[1] : null;
}

function extractRawFields(dayText, context = {}) {
  const lines = dayText.split('\n');
  const headerLine = lines[0];
  const previousEntry = context.previousEntry || null;
  let pendingBossName = context.pendingBossName || null;

  const dateMatch = headerLine.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!dateMatch) return null;
  const [, , month, day] = dateMatch;
  const date = `${month}/${day}`;

  // Extract the App Parse Block once; used as primary source for quantitative fields
  const appBlock = extractAppParseBlock(dayText);

  // Body text = dayText with the App Parse Block stripped out.
  // Used for fallback parsers so they don't accidentally match values inside the App Parse Block.
  const appBlockStart = dayText.search(/(?:^|\n)(?:#{1,3}\s*)?App Parse Block/i);
  const bodyText = appBlockStart >= 0 ? dayText.slice(0, appBlockStart) : dayText;

  let status = 'Pass';
  const statusMatch = dayText.match(/### Status\n([A-Za-z]+)/) || dayText.match(/\*\*Status:\*\* ([A-Za-z]+)/);
  if (statusMatch) {
    status = statusMatch[1].trim();
  } else if (dayText.toLowerCase().includes('status: fail')) {
    status = 'Fail';
  } else if (dayText.toLowerCase().includes('fail (')) {
    status = 'Fail';
  }
  status = /^fail$/i.test(status) ? 'Fail' : 'Pass';

  let tier = 'Tier 2';
  if (dayText.includes('Linear')) tier = 'Linear';
  else if (dayText.includes('Tier 1')) tier = 'Tier 1';
  else if (dayText.includes('Tier 3')) tier = 'Tier 3';

  // Weight — App Parse Block: "Weight: 163.0"
  let weight = null;
  if (appBlock) {
    const m = appBlock.match(/^Weight:\s*([0-9.]+)/m);
    if (m) weight = parseFloat(m[1]);
  }
  if (weight == null) {
    const weightMatch = dayText.match(/\*\*Weight:\*\*\s*~?([0-9.]+)/)
      || dayText.match(/\*\*Weight \(latest shown\):\*\*\s*~?([0-9.]+)/)
      || dayText.match(/Weight:\s*\*\*([0-9.]+)/);
    if (weightMatch) weight = parseFloat(weightMatch[1]);
  }
  // Tab-table fallback: "Weight\t165.0 lbs" (03/08 style)
  if (weight == null) {
    const m = dayText.match(/^Weight\t([0-9.]+)/m);
    if (m) weight = parseFloat(m[1]);
  }

  // Waist Navel — App Parse Block: "Abdomen (navel): 31.44"
  let waistNavel = null;
  if (appBlock) {
    const m = appBlock.match(/^Abdomen \(navel\):\s*([0-9.]+)/m);
    if (m) waistNavel = parseFloat(m[1]);
  }
  if (waistNavel == null) {
    const waistNavelMatch =
      dayText.match(/\*\*Waist \(navel\):\*\*\s*~?([0-9.]+)/)
      || dayText.match(/\*\*Abdomen \((?:at )?navel\):\*\*\s*~?([0-9.]+)/)
      || dayText.match(/Abdomen \((?:at )?navel\):\s*\*\*([0-9.]+)/)
      || dayText.match(/Waist \(navel\):\s*\*\*([0-9.]+)/)
      || dayText.match(/\*\*Waist:\*\*\s*~?([0-9.]+)/);
    if (waistNavelMatch) waistNavel = parseFloat(waistNavelMatch[1]);
  }
  // Tab-table fallback: "Abdomen (navel)\t32.32"" (03/08 style)
  if (waistNavel == null) {
    const m = dayText.match(/^Abdomen \(navel\)\t([0-9.]+)/m);
    if (m) waistNavel = parseFloat(m[1]);
  }

  // Waist +2" — App Parse Block: '+2": 30.47'
  let waistPlus2 = null;
  if (appBlock) {
    const m = appBlock.match(/^\+2["\u2033\u2032]?:\s*([0-9.]+)/m);
    if (m) waistPlus2 = parseFloat(m[1]);
  }
  if (waistPlus2 == null) {
    const waistPlus2Match =
      dayText.match(/\*\*Waist \(\+2[^)]*\) ?:\*\*\s*~?([0-9.]+)/)
      || dayText.match(/\*\*Waist \(above navel\):\*\*\s*~?([0-9.]+)/)
      || dayText.match(/\*\*\+2[^:]*:\*\*\s*~?([0-9.]+)/)
      || dayText.match(/Waist \(\+2[^)]*\):\s*\*\*([0-9.]+)/);
    if (waistPlus2Match) waistPlus2 = parseFloat(waistPlus2Match[1]);
  }
  // Tab-table fallback: "Waist (+2\")\t31.52"" (03/08 style)
  if (waistPlus2 == null) {
    const m = dayText.match(/^Waist \(\+2[^)]*\)\t([0-9.]+)/m);
    if (m) waistPlus2 = parseFloat(m[1]);
  }

  // Waist -2" — App Parse Block: "Below: 31.89"
  let waistMinus2 = null;
  if (appBlock) {
    const m = appBlock.match(/^Below:\s*([0-9.]+)/m);
    if (m) waistMinus2 = parseFloat(m[1]);
  }
  if (waistMinus2 == null) {
    const waistMinus2Match =
      dayText.match(/\*\*Waist \([\u2212\-]2[^)]*\):\*\*\s*~?([0-9.]+)/)
      || dayText.match(/\*\*Below [Aa]bdomen[^:]*:\*\*\s*~?([0-9.]+)/)
      || dayText.match(/\*\*Below \([^)]*\):\*\*\s*~?([0-9.]+)/)
      || dayText.match(/\*\*[\u2212\-]2[^:]*:\*\*\s*~?([0-9.]+)/)
      || dayText.match(/\*\*Below:\*\*\s*~?([0-9.]+)/)
      || dayText.match(/Below\s*\([^)]*\):\s*\*\*([0-9.]+)/)
      || dayText.match(/Below abdomen:\s*\*\*([0-9.]+)/);       // "Below abdomen: **32.47"**"
    if (waistMinus2Match) waistMinus2 = parseFloat(waistMinus2Match[1]);
  }
  // Tab-table fallback: "Below abdomen\t32.63"" (03/08 style)
  if (waistMinus2 == null) {
    const m = dayText.match(/^Below(?:\s+abdomen)?\t([0-9.]+)/m);
    if (m) waistMinus2 = parseFloat(m[1]);
  }

  // Sleep — App Parse Block: "Sleep: 7h 03m"
  // Use toFixed(2) not toFixed(1): "7h 03m" = 7.049999... in float, toFixed(1) rounds to "7.0"
  let sleep = null;
  if (appBlock) {
    const m = appBlock.match(/^Sleep:\s*([0-9]+)h\s*([0-9]+)m/m);
    if (m) {
      sleep = Number(m[1]) + (Number(m[2]) / 60);
      sleep = parseFloat(sleep.toFixed(2));
    }
  }
  if (sleep == null) {
    const sleepMatch1 = dayText.match(/\*\*Sleep:\*\*\s*([0-9]+)h[ ]?([0-9]+)m/)
      || dayText.match(/Sleep:\s*\*\*([0-9]+)h[ ]?([0-9]+)m/);
    if (sleepMatch1) {
      sleep = Number(sleepMatch1[1]) + (Number(sleepMatch1[2]) / 60);
      sleep = parseFloat(sleep.toFixed(2));
    } else {
      const sleepMatch2 = dayText.match(/\*\*Sleep:\*\*\s*~?([0-9.]+)/)
        || dayText.match(/Sleep:\s*\*\*([0-9.]+)/);
      if (sleepMatch2) sleep = parseFloat(sleepMatch2[1]);
    }
  }
  // Tab-table fallback: "Sleep\t8h 04m" (03/08 style)
  if (sleep == null) {
    const m = dayText.match(/^Sleep\t([0-9]+)h\s*([0-9]+)m/m);
    if (m) {
      sleep = Number(m[1]) + (Number(m[2]) / 60);
      sleep = parseFloat(sleep.toFixed(2));
    }
  }

  // Calories — App Parse Block: "Calories: 2040"
  let calories = null;
  if (tier === 'Tier 3') {
    calories = 0;
  } else {
    if (appBlock) {
      const m = appBlock.match(/^Calories:\s*([0-9,]+)/m);
      if (m) calories = parseInt(m[1].replace(/,/g, ''), 10);
    }
    if (calories == null) {
      const adjustedMatch = dayText.match(/Adjusted.*?[~+]*[0-9,]+(?:–|-)([0-9,]+)\s*effective/i)
        || dayText.match(/Adjusted.*?:.*?[~+]*[0-9,]+(?:–|-)([0-9,]+)/i);
      const rangeMatch = dayText.match(/(?:Calories|Total|Midpoint log estimate|Realistic range).*?(?:~|\b)[0-9,]+(?:–|-)([0-9,]+)/i);
      const calMatch = dayText.match(/evaluated:\s*~?([0-9,]+)/)
        || dayText.match(/Total:\s*~?([0-9,]+)/)
        || dayText.match(/~([0-9,]+)\s*kcal/)
        || dayText.match(/Calories:\s*~?([0-9,]+)/);

      if (adjustedMatch) {
        calories = parseInt(adjustedMatch[1].replace(/,/g, ''), 10);
      } else if (rangeMatch) {
        calories = parseInt(rangeMatch[1].replace(/,/g, ''), 10);
      } else if (calMatch) {
        calories = parseInt(calMatch[1].replace(/,/g, ''), 10);
      }
    }
  }

  // Protein — prefer RAW daily totals over adjusted/App Parse Block values.
  // App Parse Block often contains adjusted protein (−20%) for protocol scoring,
  // while compliance chart should reflect raw daily intake.
  let protein = null;
  if (tier === 'Tier 3') {
    protein = 0;
  } else {
    protein = parseRawDailyProtein(bodyText);

    if (protein == null) {
      // Daily total — bold-value format with optional range: "Protein:** ~185–195g" or "Protein:** ~195g"
      // Must match before the generic fallbacks which can grab per-meal values (e.g. "~50g protein")
      // Use bodyText (App Parse Block stripped) so we don't match bold-label App Parse Block values.
      const protBoldMatch = bodyText.match(/Protein:\s*\*\*?\s*~?([0-9]+)(?:[–\-]([0-9]+))?g/i);
      if (protBoldMatch) {
        const lo = parseInt(protBoldMatch[1], 10);
        const hi = protBoldMatch[2] ? parseInt(protBoldMatch[2], 10) : lo;
        protein = Math.round((lo + hi) / 2);
      }
    }
    if (protein == null) {
      // Adjusted total line: "Protein (-20%): **~175g" or "Protein (−20%): **~175g"
      const protAdjMatch = bodyText.match(/Protein\s*\([^)]*\):\s*\*\*\s*~?([0-9]+)/i);
      if (protAdjMatch) protein = parseInt(protAdjMatch[1], 10);
    }
    if (protein == null) {
      // Last-resort generic patterns — lower priority to avoid per-meal false matches
      const protMatch = bodyText.match(/~([0-9]+)g protein/)
        || bodyText.match(/Protein:\s*~?([0-9]+)/);
      if (protMatch) protein = parseInt(protMatch[1], 10);
    }

    // Final fallback to App Parse Block only if no reliable raw total was found.
    if (protein == null && appBlock) {
      const m = appBlock.match(/^Protein:\s*([0-9]+)g?/m);
      if (m) protein = parseInt(m[1], 10);
    }
  }

  let adherenceScore = null;
  const adherenceScore010 = parseLabeledValue(dayText, 'Adherence Score \\(0-10\\)');
  const adherencePercentField = parseLabeledValue(dayText, 'Daily Adherence (?:Percent|Score)');
  const overallAdherenceLine = parseLabeledValue(dayText, 'Overall adherence');
  const dailyAdherenceLine = parseLabeledValue(dayText, 'Daily Adherence');

  if (adherencePercentField) {
    const parsed = parseInt(adherencePercentField.replace(/[^0-9]/g, ''), 10);
    if (!Number.isNaN(parsed)) adherenceScore = Math.max(0, Math.min(100, parsed));
  } else if (overallAdherenceLine) {
    const parsed = parseAdherencePercentFromLine(overallAdherenceLine);
    if (parsed != null) adherenceScore = Math.max(0, Math.min(100, parsed));
  } else if (dailyAdherenceLine) {
    const parsed = parseAdherencePercentFromLine(dailyAdherenceLine);
    if (parsed != null) adherenceScore = Math.max(0, Math.min(100, parsed));
  } else if (adherenceScore010) {
    const parsed = parseFloat(adherenceScore010);
    if (!Number.isNaN(parsed)) adherenceScore = Math.max(0, Math.min(100, Math.round(parsed * 10)));
  }

  const adherenceScoreMatchFraction = dayText.match(/Adherence(?:\s+Score)?.*?(?:Final|\*\*Final|Score)?(?::\s*|\*\*\s*|\n- \*\*)?(\d+(?:\.\d+)?)\s*\/\s*(\d+)/i)
    || dayText.match(/Total(?::\s*|\*\*\s*|\n- \*\*)?(\d+(?:\.\d+)?)\s*\/\s*(\d+)/i);
  const adherenceScoreMatchPercentage = dayText.match(/Adherence(?:\s+Score)?.*?(?:Day|Final|Score|average|Overall)?(?::\s*|\*\*\s*|~|\n- \*\*.*?)?(\d{2,3})(?:%| %)/i);

  if (adherenceScore == null && adherenceScoreMatchFraction) {
    const points = parseFloat(adherenceScoreMatchFraction[1]);
    const outOf = parseInt(adherenceScoreMatchFraction[2], 10);
    if (outOf > 0) adherenceScore = Math.round((points / outOf) * 100);
  } else if (adherenceScore == null && adherenceScoreMatchPercentage) {
    adherenceScore = parseInt(adherenceScoreMatchPercentage[1], 10);
  }

  let isBossFight = false;
  let bossName = null;
  let upcomingBossName = null;

  const executionText = buildExecutionText(dayText);
  const _explicitMatchRaw = executionText.match(/Boss\s*(?:Fight|Battle)[^a-zA-Z0-9]*([a-zA-Z0-9\s']+)/i);
  // Reject if captured text starts with a temporal preposition — means the log is referencing
  // a future fight ("boss fight on March 13"), not declaring today as a boss fight.
  const explicitMatch = (_explicitMatchRaw && !/^\s*(on|for|at|in|next|until|through|from)\b/i.test(_explicitMatchRaw[1]))
    ? _explicitMatchRaw : null;
  const eventKeywords = /(valentine|buffet|thanksgiving|christmas|holiday|party|vacation|wedding|family dinner|restaurant meal|outing|lodge)/i;
  const planningKeywords = /(strategy|forecast|plan|contained|deviation|flex|indulgence|containment|controlled|honest)/i;
  const executionHasEventKeyword = eventKeywords.test(executionText);
  const explicitBossMode = normalizeNullableValue(parseLabeledValue(dayText, 'Boss Mode'));
  const explicitBossName = normalizeNullableValue(parseLabeledValue(dayText, 'Boss Name'));
  const explicitBossOutcome = normalizeNullableValue(parseLabeledValue(dayText, 'Boss Outcome'));
  const hasExplicitBossMode = Boolean(explicitBossMode && /^(none|planning|execution)$/i.test(explicitBossMode));

  const upcomingMatch = dayText.match(/upcoming\s+([a-zA-Z0-9\s']+?)\s+(?:trip|event|vacation)/i)
    || dayText.match(/Forward Plan \(([a-zA-Z0-9\s']+?)\s+Day\)/i)
    || dayText.match(/###\s*([a-zA-Z0-9\s']+?)\s+Reality Plan/i);
  if (upcomingMatch) {
    pendingBossName = upcomingMatch[1].trim();
  }

  let mentionsPendingBoss = false;
  if (pendingBossName) {
    const bossWords = pendingBossName.split(/\s+/).filter((w) => w.length > 3);
    mentionsPendingBoss = bossWords.some((w) => new RegExp(`\\b${escapeRegExp(w)}\\b`, 'i').test(executionText));
  }

  if (hasExplicitBossMode) {
    const mode = explicitBossMode.toLowerCase();
    if (mode === 'planning') {
      if (explicitBossName) {
        pendingBossName = explicitBossName;
        upcomingBossName = explicitBossName;
      }
    } else if (mode === 'execution') {
      isBossFight = true;
      bossName = explicitBossName || pendingBossName;
      if (explicitBossOutcome && /^pass$/i.test(explicitBossOutcome)) status = 'Pass';
      if (explicitBossOutcome && /^fail$/i.test(explicitBossOutcome)) status = 'Fail';
    }
  } else {
    if (explicitMatch) {
      isBossFight = true;
      bossName = explicitMatch[1].trim();
    } else if (mentionsPendingBoss && executionHasEventKeyword) {
      isBossFight = true;
      bossName = pendingBossName;
    } else if (previousEntry) {
      if (previousEntry.isBossFight && previousEntry.bossName === pendingBossName && executionHasEventKeyword) {
        isBossFight = true;
        bossName = previousEntry.bossName;
      }
    }

    if (!isBossFight && executionHasEventKeyword && planningKeywords.test(executionText)) {
      const match = executionText.match(eventKeywords);
      if (match && match[1]) {
        isBossFight = true;
        bossName = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        if (bossName === 'Outing') bossName = 'Social Outing';
      }
    }

    if (!isBossFight && previousEntry) {
      if (previousEntry.isBossFight && previousEntry.bossName === pendingBossName && executionHasEventKeyword) {
        isBossFight = true;
        bossName = previousEntry.bossName;
      }
    }
  }

  return {
    date,
    weight,
    waistNavel,
    waistPlus2,
    waistMinus2,
    tier,
    status,
    calories,
    protein,
    sleep,
    adherenceScore,
    isBossFight,
    bossName,
    upcomingBossName,
    pendingBossName,
    notes: '',
  };
}

function applyOverrides(raw, dayOverride) {
  const corrected = { ...raw };
  const overrideFields = [];

  if (!dayOverride) return { corrected, overrideFields };

  const overrideKeys = ['sleep', 'protein', 'weight', 'waistNavel', 'waistPlus2', 'waistMinus2'];
  for (const key of overrideKeys) {
    if (dayOverride[key] != null) {
      corrected[key] = dayOverride[key];
      overrideFields.push(key);
    }
  }

  return { corrected, overrideFields };
}

function computeGameState(corrected, runningState, dayText) {
  let status = corrected.status;

  if (corrected.adherenceScore != null) {
    status = corrected.adherenceScore < ADHERENCE_LOW ? 'Fail' : 'Pass';
  }

  let currentStreak = runningState.currentStreak;
  let currentShield = runningState.currentShield;
  const xp = { ...runningState.xp };

  if (corrected.isBossFight) {
    if (status === 'Pass') {
      let damage = 0;
      if (corrected.calories && corrected.calories > SHIELD_OVEREAT_THRESHOLD) {
        const surplus = corrected.calories - SHIELD_OVEREAT_THRESHOLD;
        damage = Math.floor(surplus / SHIELD_DAMAGE_DENOMINATOR);
      }

      currentShield -= damage;
      if (currentShield < 0) {
        currentShield = 0;
        currentStreak = 0;
        status = 'Fail';
      }
    } else {
      status = 'Fail';
      currentStreak = 0;
      currentShield = 0;
    }
  } else if (status === 'Pass') {
    currentStreak += 1;
    currentShield = Math.min(MAX_SHIELD, currentShield + 1);
  } else if (status === 'Fail') {
    currentStreak = 0;
    currentShield = 0;
  }

  const isWorkoutDay = /(muay thai|lift|workout|training|hard set)/i.test(dayText);

  if (corrected.sleep) {
    if (corrected.sleep > SLEEP_GOAL) xp.vitality += XP.VITALITY_SLEEP;
    else if (corrected.sleep < SLEEP_POOR_PENALTY_THRESHOLD) xp.vitality = Math.max(0, xp.vitality + XP.VITALITY_POOR_SLEEP);
  }

  if (corrected.adherenceScore) {
    if (corrected.adherenceScore >= ADHERENCE_HIGH) xp.discipline += XP.DISCIPLINE_HIGH;
    else if (corrected.adherenceScore < ADHERENCE_LOW) xp.discipline = Math.max(0, xp.discipline + XP.DISCIPLINE_LOW);
  }
  if (isWorkoutDay) xp.discipline += XP.DISCIPLINE_WORKOUT;

  if (corrected.protein >= PROTEIN_FLOOR) xp.strength += XP.STRENGTH_PROTEIN;
  if (isWorkoutDay) xp.strength += XP.STRENGTH_WORKOUT;

  if (corrected.isBossFight) {
    if (status === 'Pass') xp.resilience += XP.RESILIENCE_BOSS_WIN;
    else if (status === 'Fail') xp.resilience = Math.max(0, xp.resilience + XP.RESILIENCE_BOSS_LOSS);
  }

  const attributes = {
    vitality: getLevelInfo(xp.vitality),
    discipline: getLevelInfo(xp.discipline),
    strength: getLevelInfo(xp.strength),
    resilience: getLevelInfo(xp.resilience),
  };

  const finalizedEntryFields = {
    ...corrected,
    status,
    shield: currentShield,
    streak: currentStreak,
    attributes,
  };

  const nextRunningState = {
    ...runningState,
    currentStreak,
    currentShield,
    pendingBossName: corrected.pendingBossName,
    xp,
  };

  return { finalizedEntryFields, nextRunningState };
}

function assembleEntry(finalized) {
  return {
    date: finalized.date,
    weight: finalized.weight,
    waistNavel: finalized.waistNavel,
    waistPlus2: finalized.waistPlus2,
    waistMinus2: finalized.waistMinus2,
    tier: finalized.tier,
    status: finalized.status,
    calories: finalized.calories || 0,
    protein: finalized.protein || 0,
    sleep: finalized.sleep,
    notes: finalized.notes || '',
    isBossFight: finalized.isBossFight,
    bossName: finalized.bossName,
    upcomingBossName: finalized.upcomingBossName,
    shield: finalized.shield,
    streak: finalized.streak,
    adherenceScore: finalized.adherenceScore,
    attributes: finalized.attributes,
  };
}

function collectNullFields(corrected) {
  const fieldsToCheck = [
    'weight',
    'waistNavel',
    'waistPlus2',
    'waistMinus2',
    'sleep',
    'calories',
    'protein',
    'adherenceScore',
  ];

  const nullFields = fieldsToCheck.filter((field) => corrected[field] == null);

  if (corrected.isBossFight && corrected.bossName == null) {
    nullFields.push('bossName');
  }

  return nullFields;
}

function printParseDiagnostics(diagnostics) {
  console.log('--- Parse Diagnostics ---');

  for (const day of diagnostics) {
    const nullText = `[${day.nullFields.join(',')}]`;
    const overrideText = `[${day.overrideFields.join(',')}]`;
    const warning = day.highNullCount ? ' | WARN: 3+ null fields' : '';
    console.log(`${day.date} | null: ${nullText} | overrides: ${overrideText}${warning}`);
  }

  const withOverrides = diagnostics.filter((d) => d.overrideFields.length > 0).length;
  const withHighNulls = diagnostics.filter((d) => d.highNullCount).length;
  console.log(`Summary | total days: ${diagnostics.length} | days with overrides: ${withOverrides} | days with 3+ null fields: ${withHighNulls}`);
}

function parseLogContent(content, overrides = {}, options = {}) {
  const { printDiagnostics = true } = options;

  const dayBlocks = content.split(/^## (?=\d{4}-\d{2}-\d{2})/gm);
  dayBlocks.shift();

  const results = [];
  const diagnostics = [];

  let runningState = {
    currentStreak: 0,
    currentShield: 0,
    pendingBossName: null,
    xp: {
      vitality: 0,
      discipline: 0,
      strength: 0,
      resilience: 0,
    },
  };

  for (const dayText of dayBlocks) {
    const raw = extractRawFields(dayText, {
      pendingBossName: runningState.pendingBossName,
      previousEntry: results[results.length - 1],
    });

    if (!raw) continue;

    const { corrected, overrideFields } = applyOverrides(raw, overrides[raw.date]);
    const nullFields = collectNullFields(corrected);
    const highNullCount = nullFields.length >= 3;

    diagnostics.push({
      date: corrected.date,
      nullFields,
      overrideFields,
      highNullCount,
    });

    const { finalizedEntryFields, nextRunningState } = computeGameState(corrected, runningState, dayText);
    runningState = nextRunningState;

    results.push(assembleEntry(finalizedEntryFields));
  }

  if (printDiagnostics) {
    printParseDiagnostics(diagnostics);
  }

  return results;
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'WeightCutTracker' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`Failed to fetch URL. Status code: ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_PATH = path.resolve(__dirname, '../../Personal AI /combat_nutrition_coach/daily_log.md');
const OUTPUT_PATH = path.resolve(__dirname, '../src/data.json');

async function main() {
  let content = '';

  const REMOTE_URL = process.env.DAILY_LOG_URL;
  if (REMOTE_URL) {
    console.log(`Fetching from remote URL: ${REMOTE_URL}`);
    try {
      content = await fetchUrl(REMOTE_URL);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  } else if (fs.existsSync(LOCAL_PATH)) {
    console.log(`Reading from local path: ${LOCAL_PATH}`);
    content = fs.readFileSync(LOCAL_PATH, 'utf-8');
  } else {
    console.error(`ERROR: No DAILY_LOG_URL provided and local file ${LOCAL_PATH} not found.`);
    process.exit(1);
  }

  try {
    const overridesPath = path.resolve(__dirname, '../src/data-overrides.json');
    let overrides = {};
    if (fs.existsSync(overridesPath)) {
      overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf-8'));
      console.log(`Loaded overrides for ${Object.keys(overrides).length} days.`);
    }

    const entries = parseLogContent(content, overrides, { printDiagnostics: true });

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(entries, null, 2));
    console.log(`Successfully wrote ${entries.length} days to ${OUTPUT_PATH}`);
  } catch (e) {
    console.error('Error parsing log:', e);
    process.exit(1);
  }
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectRun) {
  main();
}

export {
  parseAdherencePercentFromLine,
  extractRawFields,
  applyOverrides,
  computeGameState,
  assembleEntry,
  parseLogContent,
  main,
};
