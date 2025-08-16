# ebook-gen

A minimal eBook generator built with Next.js. Users can fill out a form, generate eBook chapters with OpenAI (or mock text if no API key), preview the Markdown, and download the result as `.md` or `.docx`.

### Prompt V2.2

Generation still uses a two-pass flow, now with a behavior-change recipe. The first pass produces a specific title and table of contents (e.g., a 14‑day screen-time reset: Day 0 Baseline → Day 11–14 review). The second pass writes each chapter with a tight intro, numbered actions with concrete timers or frequencies, an optional realistic scenario, a daily/weekly tracker snippet, and a checklist. Banned filler phrases are enforced to keep output direct.

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
