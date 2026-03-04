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
