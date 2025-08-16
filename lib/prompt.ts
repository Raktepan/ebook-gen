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
Avoid generic names like "Introduction", "Conclusion", "Overview", "พื้นฐาน", "กรณีศึกษา", "แนวโน้ม", or "สรุป".
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
  const title = isThai ? `คู่มือเกี่ยวกับ ${topic}` : `${topic} Guide`;
  const templatesTh = [
    `${topic} ในสถานการณ์จริง`,
    `กลยุทธ์ขั้นสูงของ ${topic}`,
    `แก้ปัญหาเฉพาะหน้าด้วย ${topic}`,
    `ปรับใช้ ${topic} ให้ได้ผล`,
    `ตรวจสอบผลลัพธ์ของ ${topic}`,
  ];
  const templatesEn = [
    `${topic} in Practice`,
    `Advanced Strategies for ${topic}`,
    `Solving Issues with ${topic}`,
    `Applying ${topic} Effectively`,
    `Evaluating ${topic} Outcomes`,
  ];
  const base = isThai ? templatesTh : templatesEn;
  const toc = Array.from({ length: chapters }, (_, idx) =>
    base[idx] || (isThai ? `${topic} หัวข้อที่ ${idx + 1}` : `${topic} Topic ${idx + 1}`)
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
  const banned =
    language === "th"
      ? "ประเด็นสำคัญ, ขั้นตอนแรกที่ควรทำ, ตัวเลขที่ต้องติดตาม, เทคนิคการปรับใช้, สรุปใจความของ, ในบทนี้เราจะ, ลองปฏิบัติตาม"
      : "key points, first step to take, metrics to monitor, implementation tips, summary of, in this chapter we will, try the following";
  const prompt = `You are writing chapter ${i} titled "${chapterTitle}" for an ebook about "${topic}".
Language: ${langLabel}. Audience: ${audience}. Tone: ${toneLabel}.
Target length: about ${wordsPerChapter} words (±15%).
Do not repeat the raw topic unnecessarily. Never use these phrases: ${banned}.
Structure:
1. A concise 2-3 sentence introduction.
2. 3-5 actionable subsections, each with a heading and 2-4 numbered steps using concrete numbers, time spans, or percentages.
${includeExamples ? "3. One realistic example or case study with real numbers.\n" : ""}4. A 3-5 line summary.
5. A practical checklist in markdown.
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
    ? `${chapterTitle} มีความสำคัญต่อผู้สนใจ ${audience} และช่วยพัฒนาผลลัพธ์ได้จริง. เนื้อหานี้สรุปวิธีทำงานให้เกิดผลภายในเวลาไม่นาน.`
    : `${chapterTitle} matters to ${audience} and can drive measurable results. This section outlines practical steps without fluff.`;

  const subsections = isThai
    ? [
        `### ตั้งเป้าหมาย\n1. ระบุเป้าหมายรายเดือน 3 ข้อ\n2. จัดตารางทำงานวันละ 15 นาที`,
        `### ลงมือปฏิบัติ\n1. เตรียมอุปกรณ์หลัก 2 ชนิด\n2. ทำซ้ำอย่างน้อย 10 รอบต่อสัปดาห์`,
        `### ประเมินผล\n1. บันทึกตัวเลขทุก 7 วัน\n2. ปรับขั้นตอนเมื่อผลลัพธ์ต่ำกว่า 80% ของเป้าหมาย`,
      ]
    : [
        `### Set Goals\n1. List 3 monthly targets\n2. Schedule 15 minutes daily`,
        `### Execute\n1. Prepare 2 essential tools\n2. Repeat at least 10 times each week`,
        `### Review\n1. Record metrics every 7 days\n2. Adjust if results drop below 80% of target`,
      ];

  const example = includeExamples
    ? isThai
      ? `\n### กรณีตัวอย่าง\nเจ้าของกิจการรายหนึ่งเพิ่มยอดขาย 20% ภายใน 6 เดือนหลังทำตามขั้นตอนเหล่านี้`
      : `\n### Case Example\nA small business owner grew revenue by 20% in 6 months after following these steps`
    : "";

  const summaryLines = isThai
    ? [
        `${chapterTitle} ช่วยให้เห็นผลได้เมื่อทำตามตัวเลข`,
        "ติดตามผลทุกสัปดาห์และปรับปรุงทันที",
        "เตรียมแผนสำรองในกรณีที่ผลไม่ถึงเป้า",
      ]
    : [
        `${chapterTitle} delivers results when numbers are tracked`,
        "Monitor progress weekly and iterate fast",
        "Keep a backup plan if targets are missed",
      ];

  const checklistItems = isThai
    ? ["กำหนดเป้าหมาย", "จดตัวเลขทุกสัปดาห์", "ปรับขั้นตอนให้เหมาะสม"]
    : ["set goals", "log numbers weekly", "adjust steps as needed"];

  const checklist = checklistItems.map((c) => `- [ ] ${c}`).join("\n");

  return `${intro}\n\n${subsections.join("\n\n")}${example}\n\n${isThai ? "สรุป:" : "Summary:"}\n${summaryLines.join("\n")}\n\n${isThai ? "Checklist:" : "Checklist:"}\n${checklist}`;
}
