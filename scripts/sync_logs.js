import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import {
  MAX_SHIELD, SHIELD_OVEREAT_THRESHOLD, SHIELD_DAMAGE_DENOMINATOR,
  SLEEP_GOAL, SLEEP_POOR_PENALTY_THRESHOLD, ADHERENCE_HIGH, ADHERENCE_LOW,
  PROTEIN_FLOOR, XP,
} from '../src/config.js';

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

        // Tier
        let tier = 'Tier 2';
        if (dayText.includes('Linear')) tier = 'Linear';
        else if (dayText.includes('Tier 1')) tier = 'Tier 1';
        else if (dayText.includes('Tier 3')) tier = 'Tier 3';

        // Weight
        let weight = null;
        const weightMatch = dayText.match(/\*\*Weight:\*\*\s*~?([0-9.]+)/) || dayText.match(/\*\*Weight \(latest shown\):\*\*\s*~?([0-9.]+)/);
        if (weightMatch) weight = parseFloat(weightMatch[1]);

        // Waist Navel
        let waistNavel = null;
        const waistNavelMatch = dayText.match(/\*\*Waist \(navel\):\*\*\s*~?([0-9.]+)/) || dayText.match(/\*\*Abdomen \(navel\):\*\*\s*~?([0-9.]+)/) || dayText.match(/\*\*Waist:\*\*\s*~?([0-9.]+)/);
        if (waistNavelMatch) waistNavel = parseFloat(waistNavelMatch[1]);

        // Waist Plus 2
        let waistPlus2 = null;
        const waistPlus2Match = dayText.match(/\*\*\+2":\*\*\s*~?([0-9.]+)/);
        if (waistPlus2Match) waistPlus2 = parseFloat(waistPlus2Match[1]);

        // Waist Minus 2
        let waistMinus2 = null;
        const waistMinus2Match = dayText.match(/\*\*−2":\*\*\s*~?([0-9.]+)/) || dayText.match(/\*\*Below:\*\*\s*~?([0-9.]+)/);
        if (waistMinus2Match) waistMinus2 = parseFloat(waistMinus2Match[1]);

        // Sleep
        let sleep = null;
        const sleepMatch1 = dayText.match(/\*\*Sleep:\*\*\s*([0-9]+)h[ ]?([0-9]+)m/);
        if (sleepMatch1) {
            sleep = Number(sleepMatch1[1]) + (Number(sleepMatch1[2]) / 60);
            sleep = parseFloat(sleep.toFixed(1));
        } else {
            const sleepMatch2 = dayText.match(/\*\*Sleep:\*\*\s*~?([0-9.]+)/);
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
        // Check for out of 10 or 15 points first
        const adherenceScoreMatchFraction = dayText.match(/Adherence(?:\s+Score)?.*?(?:Final|\*\*Final|Score)?(?::\s*|\*\*\s*|\n- \*\*)?(\d+(?:\.\d+)?)\s*\/\s*(\d+)/i) ||
            dayText.match(/Total(?::\s*|\*\*\s*|\n- \*\*)?(\d+(?:\.\d+)?)\s*\/\s*(\d+)/i);
        // Check for percentage
        const adherenceScoreMatchPercentage = dayText.match(/Adherence(?:\s+Score)?.*?(?:Day|Final|Score|average|Overall)?(?::\s*|\*\*\s*|~|\n- \*\*.*?)?(\d{2,3})(?:%| %)/i);

        if (adherenceScoreMatchFraction) {
            const points = parseFloat(adherenceScoreMatchFraction[1]);
            const outOf = parseInt(adherenceScoreMatchFraction[2]);
            if (outOf > 0) {
                adherenceScore = Math.round((points / outOf) * 100);
            }
        } else if (adherenceScoreMatchPercentage) {
            adherenceScore = parseInt(adherenceScoreMatchPercentage[1]);
        }

        // Gamification: Boss Battles (Heuristic Detection)
        let isBossFight = false;
        let bossName = null;

        const explicitMatch = dayText.match(/Boss\s*(?:Fight|Battle)[^a-zA-Z0-9]*([a-zA-Z0-9\s']+)/i);
        const eventKeywords = /(valentine|buffet|thanksgiving|christmas|holiday|party|vacation|wedding|family dinner|restaurant meal|outing|trip|lodge|travel)/i;
        const planningKeywords = /(strategy|forecast|plan|contained|deviation|flex|indulgence|containment|controlled|honest)/i;

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
            mentionsPendingBoss = bossWords.some(w => new RegExp(`\\b${w}\\b`, 'i').test(dayText));
        }

        if (explicitMatch) {
            isBossFight = true;
            bossName = explicitMatch[1].trim();
        } else if (mentionsPendingBoss && (eventKeywords.test(dayText) || planningKeywords.test(dayText))) {
            if (!dayText.match(/upcoming|Reality Plan|Forward Plan/i)) { // Avoid triggering on the planning day itself
                isBossFight = true;
                bossName = pendingBossName;
            }
        } else if (results.length > 0) { // If it's a consecutive event day (e.g. multi-day trip), persist the Boss Fight status
            const prevDay = results[results.length - 1];
            if (prevDay.isBossFight && prevDay.bossName === pendingBossName && eventKeywords.test(dayText)) {
                isBossFight = true;
                bossName = prevDay.bossName;
            }
        }

        // Generic fallback for un-planned Boss Battles
        if (!isBossFight && eventKeywords.test(dayText) && planningKeywords.test(dayText)) {
            const match = dayText.match(eventKeywords);
            if (match && match[1]) {
                isBossFight = true;
                bossName = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
                if (bossName === 'Outing') bossName = 'Social Outing'; // Make it slightly more epic
            }
        }

        // If it's a consecutive event day (e.g. multi-day trip), persist the Boss Fight status
        if (!isBossFight && results.length > 0) {
            const prevDay = results[results.length - 1];
            if (prevDay.isBossFight && prevDay.bossName === pendingBossName && eventKeywords.test(dayText)) {
                isBossFight = true;
                bossName = prevDay.bossName;
            }
        }

        // Apply State Engine
        if (isBossFight) {
            // If the user's log indicates it was planned/controlled, we count it as a Boss Defeat (Win)
            const isControlled = /(controlled|planned|contained|containment|honest|structur)/i.test(dayText);

            if (status === 'Pass' || isControlled) {
                status = 'Pass'; // Enforce Pass for Gamification consistency so the UI shows the Trophy

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
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(entries, null, 2));
        console.log(`Successfully wrote ${entries.length} days to ${OUTPUT_PATH}`);
    } catch (e) {
        console.error('Error parsing log:', e);
        process.exit(1);
    }
}

main();
