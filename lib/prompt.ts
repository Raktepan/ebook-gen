import OpenAI from "openai";

export interface GenerateTitleAndTocParams {
  topic: string;
  language: "th" | "en";
  audience: string;
  tone: "friendly" | "professional";
  chapters: number;
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
}: GenerateTitleAndTocParams): Promise<{ title: string; toc: string[] }> {
  const langLabel = language === "th" ? "Thai" : "English";
  const toneLabel = getToneLabel(language, tone);
  const prompt = `Create an ebook title and table of contents in ${langLabel}.
Topic: "${topic}".
Audience: ${audience}.
Tone: ${toneLabel}.
Provide ${chapters} specific chapter titles covering distinct aspects of the topic.
Avoid generic names like "Introduction", "Conclusion", or "Overview".
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
      const toc = lines.slice(1, chapters + 1).map((l) => l.replace(/^[-*]\s*/, "").trim());
      return { title, toc };
    }
  }

  const isThai = language === "th";
  const title = isThai ? `คู่มือ${topic}` : `${topic} Handbook`;
  const templatesTh = [
    `พื้นฐานของ ${topic}`,
    `การนำ ${topic} ไปใช้จริง`,
    `กรณีศึกษาเกี่ยวกับ ${topic}`,
    `ปัญหาและทางออกของ ${topic}`,
    `แนวโน้มอนาคตของ ${topic}`,
  ];
  const templatesEn = [
    `Fundamentals of ${topic}`,
    `Practical Uses of ${topic}`,
    `Case Study of ${topic}`,
    `Challenges and Solutions in ${topic}`,
    `Future Trends of ${topic}`,
  ];
  const base = isThai ? templatesTh : templatesEn;
  const toc = Array.from({ length: chapters }, (_, idx) =>
    base[idx] || (isThai ? `${topic} แง่มุมที่ ${idx + 1}` : `${topic} Aspect ${idx + 1}`)
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
}: GenerateChapterParams): Promise<string> {
  const langLabel = language === "th" ? "Thai" : "English";
  const toneLabel = getToneLabel(language, tone);
  const prompt = `You are writing chapter ${i} titled "${chapterTitle}" for an ebook about "${topic}".
Language: ${langLabel}. Audience: ${audience}. Tone: ${toneLabel}.
Target length: about ${wordsPerChapter} words (±15%).
Requirements:
- Start with a 2-3 sentence introduction.
- Provide 3-5 subsections. Each subsection must have a descriptive heading and 2-4 numbered steps or bullet points with concrete numbers, metrics, or examples (avoid generic labels like "ข้อ 1" or "Section 1").
${includeExamples ? "- Include one clearly labeled example or case study with real numbers and context.\n" : ""}- End with a 3-5 sentence summary and a practical checklist (markdown list).
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
    ? `${chapterTitle} มีบทบาทสำคัญต่อกลุ่ม ${audience}. การเข้าใจหัวข้อนี้ช่วยพัฒนาการทำงานได้ดีขึ้น.`
    : `${chapterTitle} is crucial for ${audience}. Understanding this topic improves practical work.`;

  const subsections = isThai
    ? [
        `### ประเด็นสำคัญ\n1. ขั้นตอนแรกที่ควรทำ\n2. ตัวเลขที่ต้องติดตาม`,
        `### เทคนิคการปรับใช้\n1. ทดลองกับตัวอย่างจริง\n2. วัดผลทุกสัปดาห์`,
        `### ปัญหาที่พบบ่อย\n1. สาเหตุหลัก\n2. วิธีแก้ไขพร้อมตัวเลข`,
      ]
    : [
        `### Key Points\n1. First step to take\n2. Metrics to monitor`,
        `### Implementation Tips\n1. Try with a real scenario\n2. Measure weekly results`,
        `### Common Pitfalls\n1. Main causes\n2. Fixes with numbers`,
      ];

  const example = includeExamples
    ? isThai
      ? `\n### ตัวอย่างจริง\nบริษัทตัวอย่างเพิ่มยอดขาย 15% ภายใน 3 เดือนด้วยการใช้ ${chapterTitle}`
      : `\n### Real Example\nA sample company increased revenue by 15% in 3 months using ${chapterTitle}`
    : "";

  const summaryLines = isThai
    ? [
        `สรุปใจความของ ${chapterTitle}`,
        "ลองปฏิบัติตามเพื่อเห็นผลจริง",
        "ประเมินและปรับปรุงสม่ำเสมอ",
      ]
    : [
        `Key points of ${chapterTitle}`,
        "Apply the steps to see results",
        "Review and refine regularly",
      ];

  const checklistItems = isThai
    ? ["ทำตามขั้นตอน", "วัดผลตัวเลข", "ปรับปรุงต่อเนื่อง"]
    : ["Follow steps", "Track metrics", "Iterate"];

  const checklist = checklistItems.map((c) => `- [ ] ${c}`).join("\n");

  return `${intro}\n\n${subsections.join("\n\n")}${example}\n\n${isThai ? "สรุป:" : "Summary:"}\n${summaryLines.join("\n")}\n\n${isThai ? "Checklist:" : "Checklist:"}\n${checklist}`;
}
