import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

function parseLogContent(content) {
    // Split on "## YYYY-MM-DD" exactly
    const dayBlocks = content.split(/^## (?=\d{4}-\d{2}-\d{2})/gm);

    // Remove the top matter (everything before the first real day)
    dayBlocks.shift();

    const results = [];

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
            const calMatch = dayText.match(/evaluated:\s*~?([0-9,]+)/) ||
                dayText.match(/Total:\s*~?([0-9,]+)/) ||
                dayText.match(/~([0-9,]+)\s*kcal/) ||
                dayText.match(/Calories:\s*~?([0-9,]+)/);
            if (calMatch) calories = parseInt(calMatch[1].replace(/,/g, ''));
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
            notes: ''
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
