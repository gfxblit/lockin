# AGENTS.md — Developer context for AI agents

## What this is

Lock In is a minimal MCQ (multiple-choice quiz) web app. Students pick a question bank from a start screen, answer one question at a time, get immediate feedback, and see a results breakdown at the end. No backend. No auth. No routing library. Keep it that way.

## Stack

- **Vite + React 18** — `npm run dev` to start, `npm run build` to build
- **No CSS framework, no component library** — all styling is inline via the `style` prop
- **No TypeScript** — plain JSX
- **GitHub Actions → GitHub Pages** — push to `main`, it deploys

The live URL is `https://gfxblit.github.io/lockin/`. Vite's `base` is set to `/lockin/` in `vite.config.js` — don't change this or asset paths break on Pages.

## File map

```
src/
  App.jsx              — entire app: state, all components, bank discovery
  main.jsx             — ReactDOM.createRoot entry point
  index.css            — reset + font-family only; all other styles are inline
  banks/
    react-basics.jsonl — one question bank (JSONL, one question per line)
    *.jsonl            — add more banks here; they appear on the start screen automatically

scripts/
  generate-bank.js     — CLI tool: generates a JSONL bank via Claude API

designs/
  README.md            — authoritative design spec (colors, spacing, typography, behavior)
  lockin.html          — interactive HTML prototype; open in browser to see the reference UI

.github/workflows/deploy.yml  — build + deploy to Pages on push to main
```

## Architecture

Everything lives in `src/App.jsx`. The component tree:

```
App                  — owns all state: selectedBank, qIndex, answers, showResults
  StartScreen        — bank picker; one card per .jsonl file in src/banks/
  QuestionScreen     — progress bar, question text, option list, explanation, prev/next nav
    Option           — single answer row; handles correct/wrong/dimmed/default states
  ResultsScreen      — score header, question breakdown, retake + back-to-banks buttons
```

State:

```js
const [selectedBank, setSelectedBank] = useState(null)   // null = show StartScreen
const [qIndex, setQIndex]             = useState(0)
const [answers, setAnswers]           = useState({})     // { [qIndex]: selectedOptionIndex }
const [showResults, setShowResults]   = useState(false)
```

Flow: **StartScreen → QuestionScreen → ResultsScreen → (Retake → QuestionScreen | All Banks → StartScreen)**

Answers are locked after selection (no changing your answer). Going back with Prev preserves the answer.

## Bank discovery

Banks are discovered at build time via Vite's `import.meta.glob`:

```js
const bankModules = import.meta.glob('./banks/*.jsonl', { query: '?raw', import: 'default', eager: true })
```

Each file is imported as a raw string, then parsed: `.trim().split('\n').filter(Boolean).map(JSON.parse)`.

Display names are derived from filenames: `react-basics.jsonl` → `"React Basics"`.

**To add a bank:** drop a `.jsonl` file in `src/banks/`, commit, push. No code changes needed.

## JSONL schema

One JSON object per line:

```jsonl
{"id":"q1","question":"...","options":["A","B","C","D"],"answer":0,"explanation":"..."}
```

- `id` — optional string
- `question` — required
- `options` — required, 2–5 items
- `answer` — required, 0-indexed
- `explanation` — optional; omit or empty string → no explanation box shown

## Generating a new bank

```bash
ANTHROPIC_API_KEY=sk-... node scripts/generate-bank.js "Python OOP" 10
```

Writes `src/banks/python-oop.jsonl`. Then commit and push to deploy.

The script uses `claude-sonnet-4-6`. Change the `model` field in the script to use a different model.

## Design tokens

The design spec in `designs/README.md` is the source of truth. Key values used in the code:

- Accent: `#5B6EE8` (indigo), accent light: `#eef0fd`
- Page bg: `#f5f4f1`, card bg: `#fff`
- Correct: green family (`#f0fdf4` / `#22c55e` / `#15803d`)
- Wrong: rose family (`#fff1f2` / `#f43f5e` / `#be123c`)
- Font: DM Sans (loaded from Google Fonts in `index.html`)

## Coding conventions

- **Inline styles only** — no CSS modules, no utility classes, no styled-components
- **No comments** unless the why is non-obvious
- **No abstraction before it's needed** — if a component is used once, it can stay in App.jsx
- Keep components small; don't extract helpers for single uses
- The `Option` component's state machine (`default`/`correct`/`wrong`/`dimmed`) is the core interaction logic — keep it clean

## What not to do

- Don't add a router — screen flow is managed with a single `selectedBank` state + two booleans
- Don't add a CSS framework — the design is fully specified with exact values; a framework adds drift
- Don't add TypeScript — not worth the setup cost for a project this size
- Don't split into multiple files unless App.jsx gets unwieldy (>500 lines)
- Don't add `localStorage` persistence unless asked

## CI/CD

`.github/workflows/deploy.yml` runs on push to `main`:
1. `actions/checkout@v4`
2. `actions/setup-node@v4` (Node 20)
3. `npm install`
4. `npm run build` → outputs to `dist/`
5. `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4`

No lock file is committed (blocked by the repo owner's global gitignore), so the workflow uses `npm install` instead of `npm ci`.
