# AGENTS.md — Developer context for AI agents

## What this is

Lock In is a minimal MCQ (multiple-choice quiz) web app. Students answer one question at a time, get immediate feedback, and see a results breakdown at the end. No backend. No auth. No routing library. Keep it that way.

## Stack

- **Vite + React 18** — `npm run dev` to start, `npm run build` to build
- **No CSS framework, no component library** — all styling is inline via the `style` prop
- **No TypeScript** — plain JSX
- **GitHub Actions → GitHub Pages** — push to `main`, it deploys

The live URL is `https://gfxblit.github.io/lockin/`. Vite's `base` is set to `/lockin/` in `vite.config.js` — don't change this or asset paths break on Pages.

## File map

```
src/
  App.jsx       — entire app: state, all components, mock data
  main.jsx      — ReactDOM.createRoot entry point
  index.css     — reset + font-family only; all other styles are inline

designs/
  README.md     — authoritative design spec (colors, spacing, typography, behavior)
  lockin.html   — interactive HTML prototype; open in browser to see the reference UI

.github/workflows/deploy.yml  — build + deploy to Pages on push to main
```

## Architecture

Everything lives in `src/App.jsx`. The component tree:

```
App                  — owns all state: qIndex, answers, showResults
  QuestionScreen     — progress bar, question text, option list, explanation, prev/next nav
    Option           — single answer row; handles correct/wrong/dimmed/default states
  ResultsScreen      — score header, question breakdown, retake button
```

State is minimal by design:

```js
const [qIndex, setQIndex]           = useState(0)
const [answers, setAnswers]         = useState({})  // { [qIndex]: selectedOptionIndex }
const [showResults, setShowResults] = useState(false)
```

Answers are locked after selection (no changing your answer). Going back with Prev preserves the answer but doesn't let you re-pick.

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
- Keep components small and readable; don't extract helpers for single uses
- The `Option` component's state machine (`default`/`correct`/`wrong`/`dimmed`) is the core interaction logic — keep it clean

## What not to do

- Don't add a router — there are only two screens, a boolean flag is sufficient
- Don't add a CSS framework — the design is fully specified with exact values; a framework adds drift
- Don't add TypeScript — not worth the setup cost for a project this size
- Don't split into multiple files unless App.jsx gets unwieldy (>500 lines)
- Don't add `localStorage` persistence unless the user asks — it's mentioned in the design spec as a suggestion, not a requirement

## CI/CD

`.github/workflows/deploy.yml` runs on push to `main`:
1. `actions/checkout@v4`
2. `actions/setup-node@v4` (Node 20)
3. `npm install`
4. `npm run build` → outputs to `dist/`
5. `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4`

No lock file is committed (blocked by the repo owner's global gitignore), so the workflow uses `npm install` instead of `npm ci`.

## Adding or changing questions

Questions are in the `QUESTIONS` array at the top of `src/App.jsx`. Schema:

```js
{
  id: "q1",           // optional string
  question: "...",    // required
  options: ["..."],   // required, 2–5 items
  answer: 0,          // required, 0-indexed
  explanation: "..."  // optional — omit or empty string to suppress the explanation box
}
```

The longer-term design intention (from `designs/README.md`) is to load questions from a `.jsonl` file placed in `public/`. That work hasn't been done yet.
