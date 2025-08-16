# ebook-gen

A minimal eBook generator built with Next.js. Users can fill out a form, choose a writing style, generate eBook chapters with OpenAI (or mock text if no API key), preview the Markdown, and download the result as `.md` or `.docx`.

### Prompt V3

Generation uses a two-pass flow with style-specific recipes. The first pass produces a focused title and table of contents from the chosen style's perspective. The second pass writes each chapter with a short intro, 3–5 actionable subsections following the style recipe, an optional example, and a summary with a practical checklist. Filler phrases are banned to keep output direct.

### Styles

The form includes a **Style** dropdown:

- `howto` – step-by-step instructions with numbers or timers.
- `explainer` – definitions, comparisons, misconceptions, and mini-quizzes.
- `course` – daily or weekly plans with exercises and progress metrics.
- `playbook` – frameworks, KPIs, templates, and checklists.
- `storylite` – narrative arc: setup → conflict → turning point → resolution → lesson.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and fill out the form. Click **Generate** to produce the Markdown eBook.

## Environment Variables

- `OPENAI_API_KEY` *(optional)* – if provided, content is generated with OpenAI. Without it, mock content is returned for demo purposes.

## Downloads

- **Download .md** – saves the generated Markdown file.
- **Download .docx** – sends the Markdown to `/api/export/docx` and returns a Word document. Basic Thai fonts are supported.

Generated output files (`.md`, `.docx`, etc.) are ignored via `.gitignore` and should not be committed.

## Build

```bash
npm run build
```
