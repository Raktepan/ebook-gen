# ebook-gen

A minimal eBook generator built with Next.js. Users can fill out a form, generate eBook chapters with OpenAI (or mock text if no API key), preview the Markdown, and download the result as `.md` or `.docx`.

### Prompt V2

Generation now uses a two-pass flow: first a specific title and table of contents are created, then each chapter is written following that outline with actionable subsections, optional real examples, and a summary checklist.

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
