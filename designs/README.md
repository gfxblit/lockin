# Handoff: Lock In — MCQ Test Interface

## Overview
A minimal, focused multiple-choice quiz interface for students. One question at a time, immediate feedback on each answer, optional explanation text per question, and a results screen at the end. Data is loaded from a `.jsonl` file.

## About the Design Files
The files in this bundle are **HTML prototypes** — high-fidelity design references showing intended look, layout, and behavior. They are not production code to ship directly.

Your task is to **recreate these designs in your React codebase**, using your existing project structure, component conventions, and any UI library already in use. If no React project exists yet, scaffold one with Vite (`npm create vite@latest -- --template react`).

## Fidelity
**High-fidelity.** Colors, typography, spacing, border radii, transitions, and interaction states are all final. Recreate pixel-closely using the values documented here.

---

## JSONL Schema

Each line in the `.jsonl` file is one JSON object:

```json
{
  "id":          "string",   // optional — unique identifier for tracking
  "question":    "string",   // required — question text
  "options":     ["string"], // required — 2–5 answer choices
  "answer":      0,          // required — 0-indexed index of the correct option
  "explanation": "string"    // optional — explanation shown after answering
}
```

Example line:
```jsonl
{"id":"q1","question":"What does JSX stand for?","options":["JavaScript XML","Java Syntax Extension","JSON XML","JavaScript XSS"],"answer":0,"explanation":"JSX stands for JavaScript XML. It lets you write HTML-like markup inside JavaScript files."}
```

**Note:** `explanation` is optional. If the field is absent or empty, no explanation box is shown after the user answers.

---

## Screens

### 1. Question Screen
The main screen. Shown for each question in sequence.

**Layout:**
- Page background: `#f5f4f1` (warm off-white)
- Centered card, `max-width: 640px`, `width: 100%`
- Page padding: `40px 16px`
- Card: `background: #fff`, `border-radius: 16px`, `box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 6px 28px rgba(0,0,0,0.05)`, `overflow: hidden`

**Progress bar** (top of card, outside padding):
- Height: `3px`
- Track: `#f0f0f0`
- Fill: accent color (default `#5B6EE8`)
- Fill width: `(currentIndex / totalQuestions) * 100%`
- Transition: `width 500ms cubic-bezier(0.4,0,0.2,1)`
- Note: bar is at 0% on Q1, advances as user moves forward

**Card body padding:** `32px 36px 36px`

**Meta line:**
- Text: `"Question {n} / {total}"`
- Font: 13px, weight 500, color `#9ca3af`
- `{n}` is current (1-indexed), `/ {total}` in color `#d1d5db`
- Margin bottom: `18px`

**Question text:**
- Font: 21px, weight 600, line-height 1.5, color `#111`
- `<h2>` element, margin `0 0 24px`

**Options list:**
- `display: flex`, `flex-direction: column`, `gap: 9px`
- Each option is a row (see Option Row below)

**Explanation box** (shown only if `answered === true` AND `question.explanation` is non-empty):
- Margin top: `14px`
- Padding: `13px 16px`
- Background: accent light color (see Accent Themes)
- Border left: `3px solid {accent}`
- Border radius: `0 8px 8px 0`
- Label: `"EXPLANATION"` — 11px, weight 600, color = accent, letter-spacing 0.8px, uppercase, margin-bottom 5px
- Body: 14px, color `#374151`, line-height 1.7

**Navigation (bottom of card):**
- `display: flex`, `justify-content: space-between`, `align-items: center`
- Margin top: `28px`
- **Prev button:**
  - Height `38px`, padding `0 20px`
  - Border: `1.5px solid #e4e4e7`, border-radius `8px`
  - Background: transparent
  - Color: `#374151` when enabled, `#d1d5db` when disabled (first question)
  - Font: 14px, weight 500
  - Disabled on Q1
- **Next button:**
  - Height `38px`, padding `0 22px`
  - Border: none, border-radius `8px`
  - Background: accent when enabled, `#e4e4e7` when disabled
  - Color: `#fff`
  - Font: 14px, weight 600
  - `cursor: not-allowed`, `opacity: 0.55` when disabled (no answer selected yet)
  - Label: `"Next →"` on all questions except last → `"See Results →"`
  - Becomes active immediately after an option is selected

---

### Option Row — States

Each option is a `div` with `display: flex`, `align-items: center`, `gap: 14px`, `padding: 14px 16px`, `border-radius: 10px`, `user-select: none`.

All color/border/opacity transitions: `200ms ease`.

| State | When | bg | border | text color | badge bg | badge color | opacity |
|-------|------|----|--------|-----------|----------|-------------|---------|
| `default` | Before answering | `#fff` | `1.5px solid #e4e4e7` | `#111` | `#f4f4f5` | `#a1a1aa` | 1 |
| `correct` | After answering — this is the right answer | `#f0fdf4` | `1.5px solid #22c55e` | `#15803d` | `#22c55e` | `#fff` | 1 |
| `wrong` | After answering — user picked this, it's wrong | `#fff1f2` | `1.5px solid #f43f5e` | `#be123c` | `#f43f5e` | `#fff` | 1 |
| `dimmed` | After answering — not selected, not correct | `#fafafa` | `1.5px solid #e4e4e7` | `#9ca3af` | `#f4f4f5` | `#d1d5db` | 0.5 |

**Letter badge** (A / B / C / D):
- Size: `30px × 30px`, `border-radius: 7px`, `flex-shrink: 0`
- Font: 13px, weight 600, centered
- In `correct` state: badge shows `✓` (not the letter)
- In `wrong` state: badge shows `✗` (not the letter)
- Transitions: background and color 200ms ease

**Option text:**
- Font: 15px, weight 500, line-height 1.45
- Transitions: color 200ms ease

**Click behavior:**
- Clicking an option immediately triggers feedback (no submit button)
- Once answered, clicking again does nothing (answers are locked)

---

### 2. Results Screen
Shown after the user clicks "See Results →" on the last question.

**Card:** same dimensions and shadow as Question Screen, `overflow: hidden`

**Score header** (top section, `border-bottom: 1px solid #f3f3f3`):
- Padding: `48px 36px 36px`, `text-align: center`
- Score number: 72px, weight 700, color = accent, line-height 1
  - Format: `{pct}%` where pct = `Math.round((correct / total) * 100)`
  - The `%` sign is 30px, weight 500, opacity 0.7
- Subtitle: `"{correct} of {total} correct"` — 16px, weight 500, color `#6b7280`, margin-bottom 4px
- Label: score message (see below) — 14px, color `#9ca3af`

**Score messages:**
- 100%: `"Perfect score!"`
- ≥ 80%: `"Great work!"`
- ≥ 60%: `"Good effort."`
- < 60%: `"Keep practicing."`

**Breakdown section:**
- Padding: `24px 36px 36px`
- Section label: `"BREAKDOWN"` — 11px, weight 600, color `#9ca3af`, letter-spacing 0.8px, uppercase, margin-bottom 14px
- List: `display: flex`, `flex-direction: column`, `gap: 8px`

**Each breakdown row:**
- `display: flex`, `align-items: flex-start`, `gap: 13px`
- Padding: `12px 14px`, border: `1.5px solid #f0f0f0`, border-radius `10px`
- Status badge: `28px × 28px`, border-radius `7px`
  - Correct: bg `#f0fdf4`, color `#22c55e`, shows `✓`
  - Wrong: bg `#fff1f2`, color `#f43f5e`, shows `✗`
  - Font: 13px, weight 700
- Question meta: `"Q{n}"` — 11px, color `#9ca3af`, weight 500, margin-bottom 2px
- Question text: 14px, color `#374151`, weight 500, line-height 1.4 (allow wrap)

**Retake button:**
- Width: `100%`, margin-top `20px`, padding `11px`
- Border: `1.5px solid {accent}`, border-radius `10px`
- Background: transparent, color: accent
- Font: 15px, weight 600
- On click: reset all state — `qIndex = 0`, `answers = {}`, return to Q1

---

## Interactions & Behavior

| Event | Action |
|-------|--------|
| Click option (unanswered) | Record answer, show feedback immediately |
| Click option (already answered) | No-op |
| Click Next (answered) | Advance to next question |
| Click Next (not answered) | No-op (button disabled) |
| Click Prev (Q2+) | Go back; previously selected answer is preserved |
| Click Prev (Q1) | No-op (button disabled) |
| Last question + answered → click "See Results →" | Show results screen |
| Click "Retake Quiz" | Reset all state, return to Q1 |

**Transitions on answer:**
- Option border, background, and text color: `200ms ease`
- Badge background and color: `200ms ease`
- Explanation box: appears immediately (no animation needed, or simple fade-in)

---

## State

```js
const [qIndex, setQIndex]           = useState(0);           // current question index
const [answers, setAnswers]         = useState({});           // { [qIndex]: selectedOptionIndex }
const [showResults, setShowResults] = useState(false);
```

Derived values (no extra state needed):
```js
const answered  = answers[qIndex] !== undefined;
const isFirst   = qIndex === 0;
const isLast    = qIndex === questions.length - 1;
const progress  = (qIndex / questions.length) * 100;
```

**Recommended:** persist `answers` + `qIndex` to `localStorage` on every change so a page refresh restores progress.

---

## Design Tokens

**Colors:**
```
Background page:   #f5f4f1
Card background:   #ffffff
Text primary:      #111111
Text secondary:    #374151
Text muted:        #6b7280
Text faint:        #9ca3af
Border default:    #e4e4e7
Border faint:      #f0f0f0

Correct bg:        #f0fdf4
Correct border:    #22c55e
Correct text:      #15803d
Correct badge bg:  #22c55e

Wrong bg:          #fff1f2
Wrong border:      #f43f5e
Wrong text:        #be123c
Wrong badge bg:    #f43f5e
```

**Accent color options (user-selectable):**
```
Indigo:      #5B6EE8   light: #eef0fd
Teal:        #0D9488   light: #f0fdfa
Violet:      #7C3AED   light: #f5f3ff
Terracotta:  #BE5A2E   light: #fff7ed
```
Default accent: `#5B6EE8` (Indigo). The "light" variant is used as the explanation box background.

**Typography:**
```
Font family:  'DM Sans', system-ui, sans-serif
             Google Fonts: https://fonts.google.com/specimen/DM+Sans
             Weights needed: 400, 500, 600, 700
             Optical size: 9..40

Question:    21px / 600 / lh 1.5
Options:     15px / 500 / lh 1.45
Meta:        13px / 500
Explanation label: 11px / 600 / uppercase / ls 0.8px
Explanation body:  14px / 400 / lh 1.7
Score:       72px / 700
Score label: 16px / 500
Breakdown Q: 14px / 500 / lh 1.4
```

**Spacing / Radii / Shadows:**
```
Card radius:        16px
Option radius:      10px
Badge radius:       7px
Button radius:      8px

Card shadow:        0 1px 3px rgba(0,0,0,0.06), 0 6px 28px rgba(0,0,0,0.05)

Card padding:       32px 36px 36px
Results padding:    48px 36px 36px  (top section)
                    24px 36px 36px  (breakdown section)

Option padding:     14px 16px
Badge size:         30×30px  (option rows)
                    28×28px  (results breakdown)
```

---

## Component Breakdown

Suggested React component structure:

```
<App>                        — state, data loading, routing between screens
  <QuestionScreen>           — question + options + nav
    <ProgressBar />          — accent-colored fill bar
    <Option />               — single answer row (× 4)
    <ExplanationBox />       — conditional, after answering
  <ResultsScreen>            — score + breakdown
    <BreakdownRow />         — one row per question
```

---

## Assets
No external images or icons. All UI uses text characters (`✓`, `✗`, `←`, `→`) and CSS shapes.

---

## Files in This Package

| File | Purpose |
|------|---------|
| `MCQ Test.html` | Full hi-fi prototype — the primary design reference. Open in a browser and interact with it. |

---

## Notes for Implementation

1. **Data loading:** Fetch the `.jsonl` file, split by newline, `JSON.parse()` each line. Filter out blank lines. Place the file in `public/` for Vite/CRA projects.
2. **Explanation field is optional:** Check `question.explanation` before rendering the box. No field = no box. Empty string = no box.
3. **Answers persist across Prev navigation:** A user can go back and see their previous answer highlighted, but cannot change it.
4. **Progress bar:** Uses question *index* (0-based) not count — so it starts empty on Q1 and fills as you advance. It does NOT reach 100% until the results screen.
5. **No timer, no question grid nav** — linear flow only, by design.
