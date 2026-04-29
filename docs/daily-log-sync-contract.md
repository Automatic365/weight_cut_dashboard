# Daily Log Sync Contract

The sync parser is intentionally strict. Each logged day should have one exact day header and one canonical App Parse Block.

## Required Day Header

Use this exact shape:

```md
## 2026-04-29 - Wednesday
```

The parser only imports sections whose header starts with `## YYYY-MM-DD`.

## Required App Parse Block

Put this near the end of the day section:

```md
### App Parse Block
Status: Pass
Weight: 160.0
Abdomen (navel): 31.50
+2": 30.80
Below: 31.90
Sleep: 7h 05m
Calories: 1650
Protein: 195g
Fast: false
Daily Adherence Score: 95
Boss Mode: none
Boss Name: null
Boss Outcome: none
```

For full fast days:

```md
### App Parse Block
Status: Pass
Calories: 0
Protein: 0g
Fast: true
Daily Adherence Score: 100
Boss Mode: none
Boss Name: null
Boss Outcome: none
```

## Rules

- Use exactly one current-day App Parse Block when possible.
- If correcting a day, use `### Corrected App Parse Block`; it supersedes earlier blocks.
- Do not put tomorrow's tier, calories, or protein inside the App Parse Block.
- `Fast: true` is the source of truth for fasting classification.
- Eating days should never have `Protein: 0g`.
