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
  const prompt = `Write chapter ${i} titled "${chapterTitle}" for an ebook about "${topic}" in ${langLabel}.
Audience: ${audience}.
Tone: ${toneLabel}.
Length: about ${wordsPerChapter} words (±15%).
Avoid generic phrases like "in this chapter we will".
Structure:
- Intro: 2-3 lines.
- 3-5 bullet points with detailed steps, numbers, or insights.
${includeExamples ? "- Include a real-world example or case study.\n" : ""}- Summary: 3-5 lines followed by a checklist of key points.`;

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
    ? `${chapterTitle} มีบทบาทสำคัญต่อกลุ่ม ${audience}\nการเข้าใจหัวข้อนี้ช่วยพัฒนาการทำงานได้ดีขึ้น`
    : `${chapterTitle} is crucial for ${audience}\nUnderstanding this topic improves practical work`;
  const bullets = isThai
    ? `- ขั้นตอนหลักของ ${chapterTitle}\n- เทคนิคที่ควรรู้\n- ตัวเลขที่ต้องติดตาม`
    : `- Key steps of ${chapterTitle}\n- Useful techniques\n- Metrics to monitor`;
  const example = includeExamples
    ? isThai
      ? `\n\n**กรณีศึกษา:** การใช้ ${chapterTitle} ในบริษัทตัวอย่าง`
      : `\n\n**Case Study:** Using ${chapterTitle} in a sample company`
    : "";
  const summaryText = isThai
    ? `สรุปใจความของ ${chapterTitle}\nลองปฏิบัติตามเพื่อเห็นผลจริง\nประเมินและปรับปรุงสม่ำเสมอ`
    : `Key points of ${chapterTitle}\nApply the steps to see results\nReview and refine regularly`;
  const checklistItems = isThai
    ? ["ทำความเข้าใจ", "ลงมือทำ", "วัดผล"]
    : ["Understand", "Act", "Measure"];
  const checklist = checklistItems.map((c) => `- [ ] ${c}`).join("\n");
  return `${intro}\n\n${bullets}${example}\n\n${isThai ? "สรุป:" : "Summary:"}\n${summaryText}\n\n${isThai ? "Checklist:" : "Checklist:"}\n${checklist}`;
}
