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

function parseLogContent(content) {
    // Split on "## YYYY-MM-DD" exactly
    const dayBlocks = content.split(/^## (?=\d{4}-\d{2}-\d{2})/gm);

    // Remove the top matter (everything before the first real day)
    dayBlocks.shift();

    const results = [];

    // Gamification State
    let currentStreak = 0;
    let currentShield = 0;
    let pendingBossName = null;

    // RPG Attributes (XP Totals)
    let xp = {
        vitality: 0,
        discipline: 0,
        strength: 0,
        resilience: 0
    };

    function getLevelInfo(totalXp) {
        if (totalXp < 0) totalXp = 0;
        let level = 1;
        let xpRequired = level * 100;
        let remainingXp = totalXp;
        while (remainingXp >= xpRequired) {
            remainingXp -= xpRequired;
            level++;
            xpRequired = level * 100;
        }
        return { level, currentLvlXp: remainingXp, nextLvlXp: xpRequired };
    }

    for (const dayText of dayBlocks) {
        const lines = dayText.split('\n');
        const headerLine = lines[0]; // e.g., "2026-02-24 — Tuesday"

        // Extract standard date: 2026-02-24 -> 02/24
        const dateMatch = headerLine.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!dateMatch) continue;
        const [, year, month, day] = dateMatch;
        const date = `${month}/${day}`;

        // Status
        let status = 'Pass';
        const statusMatch = dayText.match(/### Status\n([A-Za-z]+)/) || dayText.match(/\*\*Status:\*\* ([A-Za-z]+)/);
        if (statusMatch) {
            status = statusMatch[1].trim();
        } else if (dayText.toLowerCase().includes('status: fail')) {
            status = 'Fail';
        } else if (dayText.toLowerCase().includes('fail (')) {
            status = 'Fail';
        }
        // Normalize to binary status early. Anything not explicit Fail is treated as Pass.
        status = /^fail$/i.test(status) ? 'Fail' : 'Pass';

        // Tier
        let tier = 'Tier 2';
        if (dayText.includes('Linear')) tier = 'Linear';
        else if (dayText.includes('Tier 1')) tier = 'Tier 1';
        else if (dayText.includes('Tier 3')) tier = 'Tier 3';

        // Weight
        // Supports both: **Weight:** 163.0  and  Weight: **163.0 lbs**
        let weight = null;
        const weightMatch = dayText.match(/\*\*Weight:\*\*\s*~?([0-9.]+)/)
            || dayText.match(/\*\*Weight \(latest shown\):\*\*\s*~?([0-9.]+)/)
            || dayText.match(/Weight:\s*\*\*([0-9.]+)/);
        if (weightMatch) weight = parseFloat(weightMatch[1]);

        // Waist Navel (abdomen at navel)
        // Observed labels: "Waist (navel):", "Abdomen (navel):", "Abdomen (at navel):"
        // New bold-value format: "Abdomen (navel): **value**"
        let waistNavel = null;
        const waistNavelMatch =
            dayText.match(/\*\*Waist \(navel\):\*\*\s*~?([0-9.]+)/)              // **Waist (navel):**
            || dayText.match(/\*\*Abdomen \((?:at )?navel\):\*\*\s*~?([0-9.]+)/) // **Abdomen (navel):** / **Abdomen (at navel):**
            || dayText.match(/Abdomen \((?:at )?navel\):\s*\*\*([0-9.]+)/)        // Abdomen (navel): **value** (new format)
            || dayText.match(/Waist \(navel\):\s*\*\*([0-9.]+)/)                  // Waist (navel): **value** (new format)
            || dayText.match(/\*\*Waist:\*\*\s*~?([0-9.]+)/);                     // **Waist:** (fallback, no qualifier)
        if (waistNavelMatch) waistNavel = parseFloat(waistNavelMatch[1]);

        // Waist Plus 2 (above navel, ~+2" above)
        // Observed labels: "Waist (+2"):", "Waist (+2" above navel):", "Waist (above navel):", "+2":", "+2" Above:"
        // Also Unicode double-prime ″ variants. Feb 21 has a space before colon: "Waist (+2") :"
        let waistPlus2 = null;
        const waistPlus2Match =
            dayText.match(/\*\*Waist \(\+2[^)]*\) ?:\*\*\s*~?([0-9.]+)/)         // **Waist (+2"...):** or **Waist (+2") :**
            || dayText.match(/\*\*Waist \(above navel\):\*\*\s*~?([0-9.]+)/)      // **Waist (above navel):**
            || dayText.match(/\*\*\+2[^:]*:\*\*\s*~?([0-9.]+)/)                   // **+2":** / **+2" Above:**
            || dayText.match(/Waist \(\+2[^)]*\):\s*\*\*([0-9.]+)/);              // Waist (+2"...): **value** (new format)
        if (waistPlus2Match) waistPlus2 = parseFloat(waistPlus2Match[1]);

        // Waist Minus 2 (below navel, ~−2" below)
        // Observed labels: "−2":", "Waist (−2"):", "Below Abdomen (−2"...):", "Below abdomen:", "Below (−2"):", "Below:"
        // Unicode minus sign − (U+2212) and double-prime ″ variants throughout
        let waistMinus2 = null;
        const waistMinus2Match =
            dayText.match(/\*\*Waist \([\u2212\-]2[^)]*\):\*\*\s*~?([0-9.]+)/)   // **Waist (−2"...):**
            || dayText.match(/\*\*Below [Aa]bdomen[^:]*:\*\*\s*~?([0-9.]+)/)       // **Below Abdomen...:** / **Below abdomen:**
            || dayText.match(/\*\*Below \([^)]*\):\*\*\s*~?([0-9.]+)/)             // **Below (−2"):**
            || dayText.match(/\*\*[\u2212\-]2[^:]*:\*\*\s*~?([0-9.]+)/)            // **−2":** / **−2" Below:**
            || dayText.match(/\*\*Below:\*\*\s*~?([0-9.]+)/)                        // **Below:**
            || dayText.match(/Below\s*\([^)]*\):\s*\*\*([0-9.]+)/);                // Below (...): **value** (new format)
        if (waistMinus2Match) waistMinus2 = parseFloat(waistMinus2Match[1]);

        // Sleep
        // Supports both: **Sleep:** 7h 03m  and  Sleep: **7h 03m**
        let sleep = null;
        const sleepMatch1 = dayText.match(/\*\*Sleep:\*\*\s*([0-9]+)h[ ]?([0-9]+)m/)
            || dayText.match(/Sleep:\s*\*\*([0-9]+)h[ ]?([0-9]+)m/);
        if (sleepMatch1) {
            sleep = Number(sleepMatch1[1]) + (Number(sleepMatch1[2]) / 60);
            sleep = parseFloat(sleep.toFixed(1));
        } else {
            const sleepMatch2 = dayText.match(/\*\*Sleep:\*\*\s*~?([0-9.]+)/)
                || dayText.match(/Sleep:\s*\*\*([0-9.]+)/);
            if (sleepMatch2) sleep = parseFloat(sleepMatch2[1]);
        }

        // Calories
        let calories = null;
        if (tier === 'Tier 3') {
            calories = 0; // Fast day
        } else {
            const adjustedMatch = dayText.match(/Adjusted.*?[~+]*[0-9,]+(?:–|-)([0-9,]+)\s*effective/i) ||
                dayText.match(/Adjusted.*?:.*?[~+]*[0-9,]+(?:–|-)([0-9,]+)/i);
            const rangeMatch = dayText.match(/(?:Calories|Total|Midpoint log estimate|Realistic range).*?(?:~|\b)[0-9,]+(?:–|-)([0-9,]+)/i);
            const calMatch = dayText.match(/evaluated:\s*~?([0-9,]+)/) ||
                dayText.match(/Total:\s*~?([0-9,]+)/) ||
                dayText.match(/~([0-9,]+)\s*kcal/) ||
                dayText.match(/Calories:\s*~?([0-9,]+)/);

            if (adjustedMatch) {
                calories = parseInt(adjustedMatch[1].replace(/,/g, ''));
            } else if (rangeMatch) {
                calories = parseInt(rangeMatch[1].replace(/,/g, ''));
            } else if (calMatch) {
                calories = parseInt(calMatch[1].replace(/,/g, ''));
            }
        }

        // Protein
        let protein = null;
        if (tier === 'Tier 3') {
            protein = 0; // Fast day
        } else {
            const protMatch = dayText.match(/(?:protein|Protein):\s*~?([0-9]+)g/) ||
                dayText.match(/~([0-9]+)g protein/) ||
                dayText.match(/Protein:\s*~?([0-9]+)/);
            if (protMatch) protein = parseInt(protMatch[1]);
        }

        // Adherence Score
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

        // Check for out of 10 or 15 points first
        const adherenceScoreMatchFraction = dayText.match(/Adherence(?:\s+Score)?.*?(?:Final|\*\*Final|Score)?(?::\s*|\*\*\s*|\n- \*\*)?(\d+(?:\.\d+)?)\s*\/\s*(\d+)/i) ||
            dayText.match(/Total(?::\s*|\*\*\s*|\n- \*\*)?(\d+(?:\.\d+)?)\s*\/\s*(\d+)/i);
        // Check for percentage
        const adherenceScoreMatchPercentage = dayText.match(/Adherence(?:\s+Score)?.*?(?:Day|Final|Score|average|Overall)?(?::\s*|\*\*\s*|~|\n- \*\*.*?)?(\d{2,3})(?:%| %)/i);

        if (adherenceScore == null && adherenceScoreMatchFraction) {
            const points = parseFloat(adherenceScoreMatchFraction[1]);
            const outOf = parseInt(adherenceScoreMatchFraction[2]);
            if (outOf > 0) {
                adherenceScore = Math.round((points / outOf) * 100);
            }
        } else if (adherenceScore == null && adherenceScoreMatchPercentage) {
            adherenceScore = parseInt(adherenceScoreMatchPercentage[1]);
        }

        // Gamification: Boss Battles (Heuristic Detection)
        let isBossFight = false;
        let bossName = null;

        const executionText = buildExecutionText(dayText);
        const explicitMatch = executionText.match(/Boss\s*(?:Fight|Battle)[^a-zA-Z0-9]*([a-zA-Z0-9\s']+)/i);
        const eventKeywords = /(valentine|buffet|thanksgiving|christmas|holiday|party|vacation|wedding|family dinner|restaurant meal|outing|lodge)/i;
        const planningKeywords = /(strategy|forecast|plan|contained|deviation|flex|indulgence|containment|controlled|honest)/i;
        const executionHasEventKeyword = eventKeywords.test(executionText);
        const explicitBossMode = normalizeNullableValue(parseLabeledValue(dayText, 'Boss Mode'));
        const explicitBossName = normalizeNullableValue(parseLabeledValue(dayText, 'Boss Name'));
        const explicitBossOutcome = normalizeNullableValue(parseLabeledValue(dayText, 'Boss Outcome'));
        const hasExplicitBossMode = Boolean(explicitBossMode && /^(none|planning|execution)$/i.test(explicitBossMode));

        // Check for upcoming boss mentions to store them
        const upcomingMatch = dayText.match(/upcoming\s+([a-zA-Z0-9\s']+?)\s+(?:trip|event|vacation)/i) ||
            dayText.match(/Forward Plan \(([a-zA-Z0-9\s']+?)\s+Day\)/i) ||
            dayText.match(/###\s*([a-zA-Z0-9\s']+?)\s+Reality Plan/i);
        if (upcomingMatch) {
            pendingBossName = upcomingMatch[1].trim();
        }

        let mentionsPendingBoss = false;
        if (pendingBossName) {
            const bossWords = pendingBossName.split(/\s+/).filter(w => w.length > 3);
            mentionsPendingBoss = bossWords.some(w => new RegExp(`\\b${escapeRegExp(w)}\\b`, 'i').test(executionText));
        }

        if (hasExplicitBossMode) {
            const mode = explicitBossMode.toLowerCase();
            if (mode === 'planning') {
                if (explicitBossName) pendingBossName = explicitBossName;
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
            } else if (results.length > 0) { // If it's a consecutive event day (e.g. multi-day trip), persist the Boss Fight status
                const prevDay = results[results.length - 1];
                if (prevDay.isBossFight && prevDay.bossName === pendingBossName && executionHasEventKeyword) {
                    isBossFight = true;
                    bossName = prevDay.bossName;
                }
            }

            // Generic fallback for un-planned Boss Battles
            if (!isBossFight && executionHasEventKeyword && planningKeywords.test(executionText)) {
                const match = executionText.match(eventKeywords);
                if (match && match[1]) {
                    isBossFight = true;
                    bossName = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
                    if (bossName === 'Outing') bossName = 'Social Outing'; // Make it slightly more epic
                }
            }

            // If it's a consecutive event day (e.g. multi-day trip), persist the Boss Fight status
            if (!isBossFight && results.length > 0) {
                const prevDay = results[results.length - 1];
                if (prevDay.isBossFight && prevDay.bossName === pendingBossName && executionHasEventKeyword) {
                    isBossFight = true;
                    bossName = prevDay.bossName;
                }
            }
        }

        // Binary adherence policy: <85 is Fail, >=85 is Pass.
        if (adherenceScore != null) {
            status = adherenceScore < 85 ? 'Fail' : 'Pass';
        }

        // Apply State Engine
        if (isBossFight) {
            if (status === 'Pass') {
                // Boss trophies now require explicit pass status, never inferred from "controlled" language.

                // Dynamic Shield Damage Formula
                let damage = 0;
                if (calories && calories > SHIELD_OVEREAT_THRESHOLD) {
                    const surplus = calories - SHIELD_OVEREAT_THRESHOLD;
                    damage = Math.floor(surplus / SHIELD_DAMAGE_DENOMINATOR);
                }

                currentShield -= damage;
                if (currentShield < 0) {
                    currentShield = 0;
                    currentStreak = 0; // Shield broke, streak is lost!
                    status = 'Fail';
                }
            } else {
                status = 'Fail'; // Critical Hit
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

        // RPG Attributes Logic
        const isWorkoutDay = /(muay thai|lift|workout|training|hard set)/i.test(dayText);

        // Vitality
        if (sleep) {
            if (sleep > SLEEP_GOAL) xp.vitality += XP.VITALITY_SLEEP;
            else if (sleep < SLEEP_POOR_PENALTY_THRESHOLD) xp.vitality = Math.max(0, xp.vitality + XP.VITALITY_POOR_SLEEP);
        }

        // Discipline
        if (adherenceScore) {
            if (adherenceScore >= ADHERENCE_HIGH) xp.discipline += XP.DISCIPLINE_HIGH;
            else if (adherenceScore < ADHERENCE_LOW) xp.discipline = Math.max(0, xp.discipline + XP.DISCIPLINE_LOW);
        }
        if (isWorkoutDay) xp.discipline += XP.DISCIPLINE_WORKOUT;

        // Strength
        if (protein >= PROTEIN_FLOOR) xp.strength += XP.STRENGTH_PROTEIN;
        if (isWorkoutDay) xp.strength += XP.STRENGTH_WORKOUT;

        // Resilience
        if (isBossFight) {
            if (status === 'Pass') xp.resilience += XP.RESILIENCE_BOSS_WIN;
            else if (status === 'Fail') xp.resilience = Math.max(0, xp.resilience + XP.RESILIENCE_BOSS_LOSS);
        }

        const attributes = {
            vitality: getLevelInfo(xp.vitality),
            discipline: getLevelInfo(xp.discipline),
            strength: getLevelInfo(xp.strength),
            resilience: getLevelInfo(xp.resilience)
        };

        results.push({
            date,
            weight,
            waistNavel,
            waistPlus2,
            waistMinus2,
            tier,
            status,
            calories: calories || 0,
            protein: protein || 0,
            sleep,
            notes: '',
            isBossFight,
            bossName,
            shield: currentShield,
            streak: currentStreak,
            adherenceScore,
            attributes
        });
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

    // 1. Try Environment Variable URL first (for GitHub Actions)
    const REMOTE_URL = process.env.DAILY_LOG_URL;
    if (REMOTE_URL) {
        console.log(`Fetching from remote URL: ${REMOTE_URL}`);
        try {
            content = await fetchUrl(REMOTE_URL);
        } catch (e) {
            console.error(e.message);
            process.exit(1);
        }
    }
    // 2. Fall back to Local File (for local dev)
    else if (fs.existsSync(LOCAL_PATH)) {
        console.log(`Reading from local path: ${LOCAL_PATH}`);
        content = fs.readFileSync(LOCAL_PATH, 'utf-8');
    } else {
        console.error(`ERROR: No DAILY_LOG_URL provided and local file ${LOCAL_PATH} not found.`);
        process.exit(1);
    }

    // Parse and Save
    try {
        const entries = parseLogContent(content);

        // Apply manual overrides (corrections that aren't in the raw log)
        const overridesPath = path.resolve(__dirname, '../src/data-overrides.json');
        if (fs.existsSync(overridesPath)) {
            const overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf-8'));
            let overrideCount = 0;
            for (const entry of entries) {
                if (overrides[entry.date]) {
                    Object.assign(entry, overrides[entry.date]);
                    overrideCount++;
                }
            }
            if (overrideCount > 0) console.log(`Applied overrides to ${overrideCount} days.`);
        }

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(entries, null, 2));
        console.log(`Successfully wrote ${entries.length} days to ${OUTPUT_PATH}`);
    } catch (e) {
        console.error('Error parsing log:', e);
        process.exit(1);
    }
}

main();
