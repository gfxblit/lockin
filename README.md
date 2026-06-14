# Lock In

A minimal multiple-choice quiz interface for students. One question at a time, immediate answer feedback, optional explanations, and a results breakdown at the end.

**Live:** https://gfxblit.github.io/lockin/

## Run locally

```bash
npm install
npm run dev
```

Runs at http://localhost:5173/lockin/

## Add your own questions

Questions are hardcoded in `src/App.jsx` as the `QUESTIONS` array for now. Each entry:

```js
{
  id: "q1",                          // optional, for tracking
  question: "What does JSX stand for?",
  options: ["JavaScript XML", "Java Syntax Extension", "JSON XML", "JavaScript XSS"],
  answer: 0,                         // 0-indexed index of the correct option
  explanation: "JSX stands for..."   // optional — omit to show no explanation box
}
```

## Deploy

Push to `main`. GitHub Actions builds and deploys to GitHub Pages automatically (~25 seconds).

## Design reference

Full design spec and interactive HTML prototype are in `designs/`. Open `designs/lockin.html` in a browser to interact with the reference implementation.
