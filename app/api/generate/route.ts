import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  Style,
  getTOCPrompt,
  writeChapterPrompt,
  hasBanned,
  BAN_LIST,
} from "../../../lib/prompt";

function cleanMarkdown(text: string) {
  let cleaned = text.replace(/```(?:json)?/gi, "");
  cleaned = cleaned.replace(/[{}\[\]"]/g, "");
  BAN_LIST.forEach((b) => {
    cleaned = cleaned.replace(new RegExp(b, "gi"), "");
  });
  return cleaned.trim();
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    topic,
    language,
    audience,
    tone,
    style = "howto",
    chapters,
    wordsPerChapter,
    includeExamples,
  } = body as {
    topic: string;
    language: "th" | "en";
    audience: string;
    tone: "friendly" | "professional";
    style?: Style;
    chapters: number;
    wordsPerChapter: number;
    includeExamples: boolean;
  };

  const isThai = language === "th";
  const tocHeader = isThai ? "สารบัญ" : "Table of Contents";
  const chapterLabel = isThai ? "บทที่" : "Chapter";

  if (!process.env.OPENAI_API_KEY) {
    const title = topic;
    const tocArray = Array.from({ length: chapters }, (_, idx) =>
      isThai
        ? `ลงมือทำภารกิจ ${idx + 1} ภายใน 10 นาที`
        : `Complete task ${idx + 1} in 10 minutes`
    );
    const chaptersContent = tocArray.map((t, idx) => {
      const intro = isThai
        ? `${t} บทนำ 2–3 ประโยคแบบกระชับ`
        : `${t} concise 2–3 sentence introduction`;
      return `# ${chapterLabel} ${idx + 1}: ${t}\n\n${intro}`;
    });
    const tocList = tocArray.map((t, idx) => `- ${chapterLabel} ${idx + 1}: ${t}`);
    const markdown = `# ${title}\n\n## ${tocHeader}\n${tocList.join("\n")}\n\n${chaptersContent.join("\n\n")}`;
    return NextResponse.json({ title, toc: tocArray, markdown });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  async function run(prompt: string) {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [{ role: "user", content: prompt }],
    });
    return res.choices[0].message?.content?.trim() ?? "";
  }

  function parseTOC(text: string) {
    try {
      const json = JSON.parse(text);
      const toc: string[] = Array.isArray(json.toc)
        ? json.toc.slice(0, chapters).map((t: string) => String(t))
        : [];
      return { title: String(json.title ?? topic), toc };
    } catch {
      const lines = text.split("\n").map((l) => l.trim());
      const title = lines[0] || topic;
      const toc = lines.slice(1, chapters + 1);
      return { title, toc };
    }
  }

  // Pass 1: TOC
  const tocPrompt = getTOCPrompt({
    topic,
    language,
    audience,
    tone,
    chapters,
    style,
  });
  let tocRes = await run(tocPrompt);
  let { title, toc } = parseTOC(tocRes);
  title = cleanMarkdown(title);
  toc = toc.map((t) => cleanMarkdown(t));
  if (hasBanned(title) || toc.some(hasBanned)) {
    const strictPrompt = `${tocPrompt}\nห้ามใช้คำโครงสร้าง เช่น 'หัวข้อที่ 1/2/3', 'หัวข้อย่อย 1', 'ขั้นตอนหนึ่ง/สอง'. เขียนหัวข้อจริงตามคำอธิบายเดิม`;
    tocRes = await run(strictPrompt);
    ({ title, toc } = parseTOC(tocRes));
    title = cleanMarkdown(title);
    toc = toc.map((t) => cleanMarkdown(t));
  }
  const tocArray = Array.from({ length: chapters }, (_, idx) =>
    toc[idx] || `${chapterLabel} ${idx + 1}`
  );

  // Pass 2: Chapters
  const chaptersContent: string[] = [];
  for (let idx = 0; idx < tocArray.length; idx++) {
    const chapterTitle = tocArray[idx];
    const chapterPrompt = writeChapterPrompt({
      topic,
      chapterTitle,
      language,
      audience,
      tone,
      i: idx + 1,
      wordsPerChapter,
      includeExamples,
      style,
    });
    let chapter = await run(chapterPrompt);
    let cleaned = cleanMarkdown(chapter);
    if (hasBanned(cleaned)) {
      const strictPrompt = `${chapterPrompt}\nห้ามใช้คำโครงสร้าง เช่น 'หัวข้อที่ 1/2/3', 'หัวข้อย่อย 1', 'ขั้นตอนหนึ่ง/สอง'. เขียนหัวข้อจริงตามคำอธิบายเดิม`;
      chapter = await run(strictPrompt);
      cleaned = cleanMarkdown(chapter);
    }
    chaptersContent.push(
      `# ${chapterLabel} ${idx + 1}: ${chapterTitle}\n\n${cleaned}`
    );
  }

  const tocList = tocArray.map((t, idx) => `- ${chapterLabel} ${idx + 1}: ${t}`);
  const markdown = `# ${title}\n\n## ${tocHeader}\n${tocList.join("\n")}\n\n${chaptersContent.join("\n\n")}`;

  return NextResponse.json({ title, toc: tocArray, markdown });
}

