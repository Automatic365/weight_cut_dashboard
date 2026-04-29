import { describe, it, expect } from 'vitest';
import { parseLogContent } from './sync_logs.js';

describe('sync_logs boss lifecycle', () => {
  it('treats planning day as non-boss and execution day as trophy-eligible when pass', () => {
    const content = `# Daily Log

## 2026-03-01 — Sunday
### App Parse Block
Status: Pass
Weight: 165.0
Abdomen (navel): 32.0
+2": 31.5
Below: 32.4
Sleep: 7h 00m
Calories: 1900
Protein: 180g
Daily Adherence Score: 95
Boss Mode: planning
Boss Name: Great Wolf Lodge
Boss Outcome: none

## 2026-03-02 — Monday
### App Parse Block
Status: Pass
Weight: 164.2
Abdomen (navel): 31.9
+2": 31.4
Below: 32.2
Sleep: 7h 10m
Calories: 2100
Protein: 190g
Daily Adherence Score: 90
Boss Mode: execution
Boss Name: Great Wolf Lodge
Boss Outcome: pass
`;

    const entries = parseLogContent(content, {}, { printDiagnostics: false });
    expect(entries).toHaveLength(2);

    const planningDay = entries[0];
    const executionDay = entries[1];

    expect(planningDay.isBossFight).toBe(false);
    expect(planningDay.bossName).toBeNull();

    expect(executionDay.isBossFight).toBe(true);
    expect(executionDay.status).toBe('Pass');
    expect(executionDay.bossName).toBe('Great Wolf Lodge');
    expect(executionDay.isBossFight && executionDay.status === 'Pass' && !!executionDay.bossName).toBe(true);
  });
});

describe('sync_logs adherence normalization', () => {
  it('normalizes percent, range, fraction, and 0-10 formats to 0-100', () => {
    const content = `# Daily Log

## 2026-03-01 — Sunday
### App Parse Block
Status: Pass
Weight: 165.0
Abdomen (navel): 32.0
+2": 31.5
Below: 32.4
Sleep: 7h 00m
Calories: 1900
Protein: 180g
Daily Adherence Score: 95%
Boss Mode: none

## 2026-03-02 — Monday
### App Parse Block
Status: Pass
Weight: 164.2
Abdomen (navel): 31.9
+2": 31.4
Below: 32.2
Sleep: 7h 10m
Calories: 2000
Protein: 185g
Overall adherence: 90–95%
Boss Mode: none

## 2026-03-03 — Tuesday
### App Parse Block
Status: Pass
Weight: 164.0
Abdomen (navel): 31.8
+2": 31.3
Below: 32.1
Sleep: 7h 20m
Calories: 2050
Protein: 190g
Adherence Score: 9.5/10
Boss Mode: none

## 2026-03-04 — Wednesday
### App Parse Block
Status: Pass
Weight: 163.8
Abdomen (navel): 31.7
+2": 31.2
Below: 32.0
Sleep: 7h 30m
Calories: 1950
Protein: 188g
Adherence Score (0-10): 8.5
Boss Mode: none
`;

    const entries = parseLogContent(content, {}, { printDiagnostics: false });
    expect(entries).toHaveLength(4);
    expect(entries.map((e) => e.adherenceScore)).toEqual([95, 93, 95, 85]);
  });
});

describe('sync_logs raw protein extraction', () => {
  it('prefers explicit raw daily totals over app block protein values', () => {
    const content = `# Daily Log

## 2026-03-04 — Wednesday
Daily Handover

Nutrition Log
Meal 1
Protein: ~48 g

Meal 2
Protein: ~74 g

Reported Intake
Calories: ~1,240
Protein: ~209 g

Protocol Adjusted
Protein (−20%): 167 g

### App Parse Block
Status: Pass
Weight: 162.6
Abdomen (navel): 31.94
+2": 31.66
Below: 32.69
Sleep: 7h 3m
Calories: 1550
Protein: 167g
Daily Adherence Score: 96
Boss Mode: planning
Boss Name: Friday Dinner Out
Boss Outcome: none
`;

    const entries = parseLogContent(content, {}, { printDiagnostics: false });
    expect(entries).toHaveLength(1);
    expect(entries[0].protein).toBe(209);
    expect(entries[0].parseVerification?.proteinSource).toBe('raw_daily_total');
  });

  it('prefers corrected block and treats prior disagreement as resolved', () => {
    const content = `# Daily Log

## 2026-04-13 — Monday
### App Parse Block
Status: Pass
Calories: 1700
Protein: 200g

### Corrected App Parse Block
Status: Pass
Calories: 1840
Protein: 205g
`;

    const entries = parseLogContent(content, {}, { printDiagnostics: false });
    expect(entries).toHaveLength(1);
    expect(entries[0].calories).toBe(1840);
    expect(entries[0].protein).toBe(205);
    expect(entries[0].parseVerification?.appParseBlockCount).toBe(2);
    expect(entries[0].parseVerification?.selectedAppParseBlockIndex).toBe(2);
    expect(entries[0].parseVerification?.hasCorrectedAppParseBlock).toBe(true);
    expect(entries[0].parseVerification?.hasConflictingAppParseBlocks).toBe(false);
  });

  it('filters out cross-day parse blocks and does not flag unresolved conflict', () => {
    const content = `# Daily Log

## 2026-04-03 — Friday
### App Parse Block
**Status:** Pass
**Calories:** 2100
**Protein:** 190g
Date: April 3, 2026

### App Parse Block
**Status:** Fail
**Calories:** 3000
**Protein:** 110g
Date: April 4, 2026
`;

    const entries = parseLogContent(content, {}, { printDiagnostics: false });
    expect(entries).toHaveLength(1);
    expect(entries[0].calories).toBe(2100);
    expect(entries[0].protein).toBe(190);
    expect(entries[0].parseVerification?.appParseBlockCount).toBe(2);
    expect(entries[0].parseVerification?.selectedAppParseBlockIndex).toBe(1);
    expect(entries[0].parseVerification?.hasConflictingAppParseBlocks).toBe(false);
  });

  it('does not infer protein from meal-level lines when daily total is missing', () => {
    const content = `# Daily Log

## 2026-04-14 — Tuesday
Meal 1
Protein: ~48 g

Meal 2
~52g protein

Calories: 1650
`;

    const entries = parseLogContent(content, {}, { printDiagnostics: false });
    expect(entries).toHaveLength(1);
    expect(entries[0].protein).toBeNull();
    expect(entries[0].parseVerification?.proteinSource).toBe('unknown');
  });

  it('prefers raw daily total over app block when both are present', () => {
    const content = `# Daily Log

## 2026-04-15 — Wednesday
## Daily Intake (RAW)
Protein: ~205g

### App Parse Block
Status: Pass
Calories: 1800
Protein: 160g
`;

    const entries = parseLogContent(content, {}, { printDiagnostics: false });
    expect(entries).toHaveLength(1);
    expect(entries[0].protein).toBe(205);
    expect(entries[0].parseVerification?.proteinSource).toBe('raw_daily_total');
  });

  it('uses protein-hit assertion floor on non-fast days when parser value is below floor', () => {
    const content = `# Daily Log

## 2026-04-16 — Thursday
Protein hit ✅

### App Parse Block
Status: Pass
Calories: 2200
Protein: 140g
`;

    const entries = parseLogContent(content, {}, { printDiagnostics: false });
    expect(entries).toHaveLength(1);
    expect(entries[0].protein).toBe(190);
    expect(entries[0].parseVerification?.proteinSource).toBe('protein_hit_assertion');
  });

  it('uses unadjusted totals as canonical source for both calories and protein', () => {
    const content = `# Daily Log

## 2026-02-25 — Wednesday
#### Unadjusted Totals
- ~1,360 kcal
- ~222g protein

#### Adjusted Totals
- ~1,700 kcal
- ~178g protein
`;

    const entries = parseLogContent(content, {}, { printDiagnostics: false });
    expect(entries).toHaveLength(1);
    expect(entries[0].calories).toBe(1360);
    expect(entries[0].protein).toBe(222);
    expect(entries[0].parseVerification?.proteinSource).toBe('raw_daily_total');
  });

  it('ignores activity-only kcal lines when unadjusted totals are available', () => {
    const content = `# Daily Log

## 2026-02-25 — Wednesday
### Activity
- ~114 kcal

#### Unadjusted Totals
- ~1,360 kcal
- ~222g protein
`;

    const entries = parseLogContent(content, {}, { printDiagnostics: false });
    expect(entries).toHaveLength(1);
    expect(entries[0].calories).toBe(1360);
    expect(entries[0].protein).toBe(222);
  });

  it('classifies completed fast days as fasting even when tomorrow is Linear', () => {
    const content = `# Daily Log

## 2026-04-15 — Wednesday
Handover — Wednesday (Tier 3: Full Fast)

Execution Summary
Full fast completed (0 kcal)

Tomorrow Plan (Thursday)
Tier: Linear

### App Parse Block
Status: Pass
Weight: 163.0
Abdomen (navel): 31.98
+2": 30.81
Below: 32.05
Sleep: 6h 37m
Calories: 0
Protein: 0g
Daily Adherence Score: 100
Boss Mode: none
`;

    const entries = parseLogContent(content, {}, { printDiagnostics: false });
    expect(entries).toHaveLength(1);
    expect(entries[0].tier).toBe('Tier 3');
    expect(entries[0].isFast).toBe(true);
    expect(entries[0].parseVerification?.isFastDay).toBe(true);
    expect(entries[0].protein).toBe(0);
  });

  it('lets canonical fast fields override ambiguous tier language', () => {
    const content = `# Daily Log

## 2026-04-16 — Thursday
Tier: Linear

### App Parse Block
Status: Pass
Fast: true
Calories: 0
Protein: 0g
`;

    const entries = parseLogContent(content, {}, { printDiagnostics: false });
    expect(entries).toHaveLength(1);
    expect(entries[0].tier).toBe('Tier 3');
    expect(entries[0].isFast).toBe(true);
  });

  it('does not let tomorrow fast plans override today eating macros', () => {
    const content = `# Daily Log

## 2026-04-28 — Tuesday
Official Daily Handover
Date & Tier: Tuesday, April 28, 2026 | Linear

Tomorrow's Battle Plan: Wednesday
Tier: Tier 3 (24-Hour Fast)
Rules: 0 Calories.

### App Parse Block
Status: Pass
Calories: 1810
Protein: 254g
`;

    const entries = parseLogContent(content, {}, { printDiagnostics: false });
    expect(entries).toHaveLength(1);
    expect(entries[0].tier).toBe('Linear');
    expect(entries[0].isFast).toBe(false);
    expect(entries[0].protein).toBe(254);
  });
});
