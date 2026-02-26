import fs from 'fs';

const filePath = '/Users/jhanna/Repo/Personal AI /combat_nutrition_coach/daily_log.md';
const content = fs.readFileSync(filePath, 'utf-8');

// Use regex to split on "## YYYY-MM-DD" exactly
const dayBlocks = content.split(/^## (?=\d{4}-\d{2}-\d{2})/gm);

// The first block will be the header "Daily Log — Long Term Memory..."
// The rest will be the actual days, starting with "2026-01-19"
dayBlocks.shift(); // Remove the top matter

const dayText = dayBlocks[dayBlocks.length - 2]; // 02/24

console.log("--- DAY TEXT ---");
console.log(dayText.substring(0, 200) + '...');
console.log("--- PARSING MULTI ---");

const weightMatch = dayText.match(/\*\*Weight:\*\*\s*~?([0-9.]+)/);
console.log("Weight:", weightMatch ? weightMatch[1] : null);

const waistNavelMatch = dayText.match(/\*\*Waist \(navel\):\*\*\s*~?([0-9.]+)/) || dayText.match(/\*\*Abdomen \(navel\):\*\*\s*~?([0-9.]+)/) || dayText.match(/\*\*Waist:\*\*\s*~?([0-9.]+)/);
console.log("WaistNavel:", waistNavelMatch ? waistNavelMatch[1] : null);

const waistPlus2Match = dayText.match(/\*\*\+2":\*\*\s*~?([0-9.]+)/);
console.log("Waist+2:", waistPlus2Match ? waistPlus2Match[1] : null);

const caloriesMatch = dayText.match(/evaluated:\s*~?([0-9,]+)/) || dayText.match(/Total:\s*~?([0-9,]+)/) || dayText.match(/~([0-9,]+)\s*kcal/) || dayText.match(/Calories:\s*~?([0-9,]+)/);
console.log("Calories:", caloriesMatch ? caloriesMatch[1] : null);

const proteinMatch = dayText.match(/(?:protein|Protein):\s*~?([0-9]+)g/) || dayText.match(/~([0-9]+)g protein/) || dayText.match(/Protein:\s*~?([0-9]+)/);
console.log("Protein:", proteinMatch ? proteinMatch[1] : null);
