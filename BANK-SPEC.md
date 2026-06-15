# Bank Generation Specification (BANK-SPEC.md)

This document defines the requirements for generating question banks for the Lock In MCQ app. All question banks must follow these standards to ensure pedagogical rigor and stylistic consistency.

## 1. Core Principles
- **No Hallucination:** All questions, options, and explanations must be grounded in the provided source material.
- **No Internal Labels:** Do NOT include internal labels like "Type A:", "Quizlet-Style", "Document Analysis", or "Visual Document Analysis" within the user-facing `question` field. The question text should be clean and direct.
- **Answer Integrity:** Never include the answer or strong spoilers within the question text itself.
- **Explanations:** Every question must include an `explanation` field that clarifies *why* the answer is correct and provides a specific reference to the source material (e.g., "Strayer, Ch. 6").
- **High-Nuance Distractors:** Avoid "obviously wrong" or "comical" distractors. All options must be plausible to a student who has not mastered the specific details of the text. Use similar regions, time periods, or historical processes as distractors to force precise recall.
- **Target Difficulty:** Aim for a difficulty level where an advanced 8th-grade student would score between 50-75% on their first attempt. Questions should probe for "who, what, when, where, and why" as well as complex relationships between societies.

## 2. Question Types

### Type A: Quizlet-Style (Conceptual & Concise)
- **Goal:** Probe for understanding of key terms, historical significance, or comparative concepts.
- **Format:** Short, direct questions.
- **Inspiration:** [AP Ways of the World Chapter 4 Quizlet](https://quizlet.com/325903398/ap-ways-of-the-world-honors-chapter-4-study-guide-flash-cards/).
- **Rule:** Keep the question text under 2 sentences. Focus on "Historical Significance" rather than just definitions.

### Type B: Document Analysis (Primary Source Only)
- **Goal:** Test reading comprehension and historical reasoning using original evidence.
- **Format:** A verbatim paragraph of text followed by a question.
- **Source Material:** Must be a **Primary Source ONLY** (e.g., an excerpt from a 4th-century inscription, a royal decree, or a traveler's account). Do NOT use secondary source summaries for this type.
- **Structure:** 
  - The `question` field should contain the verbatim primary source text first, followed by a double newline and the actual question.
  - Multiple MCQ entries may be generated from the same primary source paragraph to probe different angles of understanding.

### Type C: Visual Document Analysis (Visuals as Evidence)
- **Goal:** Test the ability to interpret non-textual evidence (maps, charts, artifacts, diagrams).
- **Format:** A question that requires the student to look at an image to identify a location, trend, or symbolic detail.
- **Source Material:** Must use an extracted image from the PDF (e.g., `images/ch6-text/img-001.png`).
- **Rule:** The question must be unsolvable without viewing the image (e.g., "According to Map 6.1, which route..." or "In Visual Source 6.1, what detail...").

## 3. JSONL Schema
Each line must be a valid JSON object:
```json
{
  "id": "unique-id",
  "question": "Verbatim Primary Source Text...\n\nActual question based on text?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": 0,
  "explanation": "Detailed explanation citing the source.",
  "image": "images/slug/img-XXX.png"
}
```
*Note: The `image` field is required for Type C.*

## 4. Quality Checklist
1. Is the question concise?
2. Does the primary source text match the source material verbatim?
3. Is the answer excluded from the question prompt?
4. Does the explanation provide a specific page or chapter reference?
5. For Type C: Does the question explicitly reference the visual evidence provided?
