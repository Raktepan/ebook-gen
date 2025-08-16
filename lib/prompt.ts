const BAN_LIST = [
  "หัวข้อที่ 1",
  "หัวข้อที่ 2",
  "หัวข้อที่ 3",
  "หัวข้อย่อย 1",
  "ขั้นตอนหนึ่ง",
  "ขั้นตอนสอง",
  "ประเด็นสำคัญ",
  "สรุปใจความของ",
  "ในบทนี้เราจะ",
];

function hasBanned(text: string) {
  const lower = text.toLowerCase();
  return BAN_LIST.some((b) => lower.includes(b.toLowerCase()));
}

export type Style =
  | "howto"
  | "explainer"
  | "course"
  | "playbook"
  | "storylite";

export const recipeMap: Record<Style, string> = {
  howto:
    "subsections as step-by-step instructions using action verbs and numbers or timers; chapter titles start with an action verb and include a numeric anchor",
  explainer:
    "subsections covering definitions, comparisons, misconceptions, and mini-quizzes",
  course:
    "subsections as daily or weekly plans with exercises and progress metrics",
  playbook:
    "subsections with frameworks, KPIs, templates, and checklists",
  storylite:
    "subsections following a narrative arc: setup, conflict, turning point, resolution, lesson",
};

export interface GetTOCPromptParams {
  topic: string;
  language: "th" | "en";
  audience: string;
  tone: "friendly" | "professional";
  chapters: number;
  style: Style;
}

export interface WriteChapterParams {
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

function getToneLabel(
  language: "th" | "en",
  tone: "friendly" | "professional"
) {
  if (tone === "friendly") {
    return language === "th" ? "เป็นกันเอง" : "friendly";
  }
  return language === "th" ? "เป็นทางการ" : "professional";
}

export function getTOCPrompt({
  topic,
  language,
  audience,
  tone,
  chapters,
  style,
}: GetTOCPromptParams): string {
  const langLabel = language === "th" ? "Thai" : "English";
  const toneLabel = getToneLabel(language, tone);
  const recipe = recipeMap[style];
  const bannedStr = BAN_LIST.map((b) => `"${b}"`).join(", ");
  return `You plan an ebook outline in ${langLabel}.
Global rules:
- Ban these exact phrases (case-insensitive): ${bannedStr}.
- Avoid repeating the raw topic.
Topic: "${topic}".
Audience: ${audience}.
Tone: ${toneLabel}.
Style: ${style} (${recipe}).
Generate a specific title and table of contents with ${chapters} chapters.
Avoid generic or placeholder titles like "พื้นฐาน", "แนวโน้ม", "กรณีศึกษา", "สรุป", or "หัวข้อที่...".
${style === "howto" ? "Each chapter title must start with an action verb and include a number or timer." : ""}
Return only valid JSON: {"title": string, "toc": string[]}.`;
}

export function writeChapterPrompt({
  topic,
  chapterTitle,
  language,
  audience,
  tone,
  i,
  wordsPerChapter,
  includeExamples,
  style,
}: WriteChapterParams): string {
  const langLabel = language === "th" ? "Thai" : "English";
  const toneLabel = getToneLabel(language, tone);
  const recipe = recipeMap[style];
  const bannedStr = BAN_LIST.join(", ");
  return `Write chapter ${i} titled "${chapterTitle}" for an ebook on "${topic}".
Language: ${langLabel}. Audience: ${audience}. Tone: ${toneLabel}. Style: ${style} (${recipe}).
Global rules:
- Ban these exact phrases (case-insensitive): ${bannedStr}.
- Do not repeat the raw topic.
Target length: about ${wordsPerChapter} words (±15%).
Structure:
1) 2–3 sentence introduction with no fluff.
2) 3–5 actionable subsections with concrete numbers, timers, steps or frequencies.
${includeExamples ? "3) One realistic example matching the domain.\n4) 3–5 line summary.\n5) Practical checklist in Markdown." : "3) 3–5 line summary.\n4) Practical checklist in Markdown."}
Write the chapter in Markdown.`;
}

export { BAN_LIST, hasBanned };

