import OpenAI from "openai";

export type Style =
  | "howto"
  | "explainer"
  | "course"
  | "playbook"
  | "storylite";

export const recipeMap: Record<Style, string> = {
  howto:
    "subsections as step-by-step instructions with numbers/timers/frequencies",
  explainer:
    "subsections covering definitions, comparisons, misconceptions, and mini-quizzes",
  course:
    "subsections as daily or weekly plans with exercises and progress metrics",
  playbook:
    "subsections with frameworks, KPIs, templates, and checklists",
  storylite:
    "subsections following a narrative arc: setup, conflict, turning point, resolution, lesson",
};

export interface GenerateTitleAndTocParams {
  topic: string;
  language: "th" | "en";
  audience: string;
  tone: "friendly" | "professional";
  chapters: number;
  style: Style;
}

export interface GenerateChapterParams {
  topic: string;
  chapterTitle: string;
  language: "th" | "en";
  audience: string;
  tone: "friendly" | "professional";
  i: number;
  wordsPerChapter: number;
  includeExamples: boolean;
  style: Style;
}

function getToneLabel(language: "th" | "en", tone: "friendly" | "professional") {
  if (tone === "friendly") {
    return language === "th" ? "เป็นกันเอง" : "friendly";
  }
  return language === "th" ? "เป็นทางการ" : "professional";
}

export async function generateTitleAndToc({
  topic,
  language,
  audience,
  tone,
  chapters,
  style,
}: GenerateTitleAndTocParams): Promise<{ title: string; toc: string[] }> {
  const langLabel = language === "th" ? "Thai" : "English";
  const toneLabel = getToneLabel(language, tone);
  const recipe = recipeMap[style];
  const banned = '"ประเด็นสำคัญ", "ขั้นตอนแรกที่ควรทำ", "สรุปใจความของ", "ในบทนี้เราจะ"';
  const prompt = `You plan an ebook outline in ${langLabel}.
Global rules:
- Ban filler phrases: ${banned}.
- Avoid repeating the raw topic.
Topic: "${topic}".
Audience: ${audience}.
Tone: ${toneLabel}.
Style: ${style} (${recipe}).
Generate a specific title and table of contents with ${chapters} chapters.
Avoid generic names like "Introduction", "Conclusion", "Overview", "พื้นฐาน", "แนวโน้ม", or "สรุป".
Return JSON: {"title": string, "toc": string[]}.`;

  if (process.env.OPENAI_API_KEY) {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [{ role: "user", content: prompt }],
    });
    const text = res.choices[0].message?.content?.trim() ?? "";
    try {
      const json = JSON.parse(text);
      const toc: string[] = Array.isArray(json.toc)
        ? json.toc.slice(0, chapters).map((t: string) => t.trim())
        : [];
      return { title: String(json.title ?? topic), toc };
    } catch {
      const lines = text.split("\n");
      const title = lines[0] || topic;
      const toc = lines
        .slice(1, chapters + 1)
        .map((l) => l.replace(/^[-*]\s*/, "").trim());
      return { title, toc };
    }
  }
  const isThai = language === "th";
  const title = isThai ? `${topic}` : `${topic}`;
  const toc = Array.from({ length: chapters }, (_, idx) =>
    isThai ? `หัวข้อที่ ${idx + 1}` : `Chapter ${idx + 1}`
  );
  return { title, toc };
}

export async function generateChapter({
  topic,
  chapterTitle,
  language,
  audience,
  tone,
  i,
  wordsPerChapter,
  includeExamples,
  style,
}: GenerateChapterParams): Promise<string> {
  const langLabel = language === "th" ? "Thai" : "English";
  const toneLabel = getToneLabel(language, tone);
  const recipe = recipeMap[style];
  const banned =
    language === "th"
      ? "ประเด็นสำคัญ, ขั้นตอนแรกที่ควรทำ, สรุปใจความของ, ในบทนี้เราจะ"
      : "key points, first step to take, summary of, in this chapter we will";
  const prompt = `Write chapter ${i} titled "${chapterTitle}" for an ebook on "${topic}".
Language: ${langLabel}. Audience: ${audience}. Tone: ${toneLabel}. Style: ${style}.
Global rules:
- Ban these phrases: ${banned}.
- Do not repeat the raw topic.
Target length: about ${wordsPerChapter} words (±15%).
Use this recipe: ${recipe}.
Structure:
1) 2–3 sentence introduction.
2) 3–5 actionable subsections following the style recipe with concrete numbers, timers, steps or percentages.
${includeExamples ? "3) Include one example or case study.\n4) 3–5 line summary with a practical checklist." : "3) 3–5 line summary with a practical checklist."}
${includeExamples ? "5) Practical checklist in Markdown." : "4) Practical checklist in Markdown."}
Write the chapter in Markdown.`;

  if (process.env.OPENAI_API_KEY) {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [{ role: "user", content: prompt }],
    });
    return res.choices[0].message?.content?.trim() ?? "";
  }

  const isThai = language === "th";
  const intro = isThai
    ? `${chapterTitle} บทนำสั้นๆ 2–3 ประโยค.`
    : `${chapterTitle} short introduction in 2–3 sentences.`;
  const subsections = Array.from({ length: 3 }, (_, idx) =>
    isThai
      ? `### หัวข้อย่อย ${idx + 1}\n1. ขั้นตอนหนึ่ง\n2. ขั้นตอนสอง`
      : `### Subsection ${idx + 1}\n1. Step one\n2. Step two`
  );
  const example = includeExamples
    ? isThai
      ? `\n### กรณีศึกษา\nตัวอย่างประกอบ`
      : `\n### Example\nA short illustrative case`
    : "";
  const summary = isThai
    ? `\n\nสรุป:\n- ข้อคิดหนึ่ง\n- ข้อคิดสอง`
    : `\n\nSummary:\n- Takeaway one\n- Takeaway two`;
  const checklist = isThai
    ? `\n\nChecklist:\n- [ ] ทำข้อหนึ่ง\n- [ ] ทำข้อสอง`
    : `\n\nChecklist:\n- [ ] Do item one\n- [ ] Do item two`;
  return `${intro}\n\n${subsections.join("\n\n")}${example}${summary}${checklist}`;
}
