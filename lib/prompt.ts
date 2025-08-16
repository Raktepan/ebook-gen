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
  const prompt = `You plan an ebook outline in ${langLabel}.
Global rules:
- Ban filler phrases: "ประเด็นสำคัญ", "ขั้นตอนแรกที่ควรทำ", "ตัวเลขที่ต้องติดตาม", "เทคนิคการปรับใช้", "สรุปใจความของ", "ในบทนี้เราจะ", "ลองปฏิบัติตาม".
- Do not echo the full topic in every line.
Topic: "${topic}".
Audience: ${audience}.
Tone: ${toneLabel}.
Generate ${chapters} specific chapter titles.
Avoid generic names like "Introduction", "Conclusion", "Overview", "พื้นฐาน", "กรณีศึกษา", "แนวโน้ม", or "สรุป".
If the topic involves reducing phone use, digital wellbeing, or screen time, prefer a 14-day plan:
1) Day 0 Baseline: วัดเวลาหน้าจอ (ตั้งเป้า 50% จาก baseline, e.g. 180→90 นาที/วัน)
2) Day 1–3 ลดแรงดึงดูด: ตั้ง Focus/DND, App Limits, Downtime, หน้าจอ Grayscale
3) Day 4–7 จัดสภาพแวดล้อม: ย้ายแอปเสี่ยงออกจากหน้าแรก, ปิดแจ้งเตือน non-urgent, ชาร์จนอกห้องนอน
4) Day 8–10 สร้างกิจกรรมทดแทน: Pomodoro 25/5, เดิน 10 นาที, หนังสือ 20 นาที
5) Day 11–14 ป้องกันรี lapse + ประเมินผล: ถ้าเกินโควตา ให้ IF–THEN plan
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
  const lowerTopic = topic.toLowerCase();
  const impliesDigitalWellbeing = [
    "phone",
    "screen",
    "digital wellbeing",
    "screen time",
    "มือถือ",
    "เวลาหน้าจอ",
  ].some((k) => lowerTopic.includes(k));

  if (impliesDigitalWellbeing) {
    const title = isThai ? "แผนลดเวลาหน้าจอ 14 วัน" : "14-Day Screen Time Reset";
    const plan = [
      "Day 0 Baseline: วัดเวลาหน้าจอ",
      "Day 1–3 ลดแรงดึงดูด: ตั้ง Focus/DND, App Limits, Downtime, หน้าจอ Grayscale",
      "Day 4–7 จัดสภาพแวดล้อม: ย้ายแอปเสี่ยงออกจากหน้าแรก, ปิดแจ้งเตือน non-urgent, ชาร์จนอกห้องนอน",
      "Day 8–10 สร้างกิจกรรมทดแทน: Pomodoro 25/5, เดิน 10 นาที, หนังสือ 20 นาที",
      "Day 11–14 ป้องกันรี lapse + ประเมินผล: ถ้าเกินโควตา ให้ IF–THEN plan",
    ];
    return { title, toc: plan.slice(0, chapters) };
  }

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
  const prompt = `Write chapter ${i} titled "${chapterTitle}" for an ebook on "${topic}".
Language: ${langLabel}. Audience: ${audience}. Tone: ${toneLabel}.
Global rules:
- Ban these phrases: ${banned}.
- Do not repeat the raw topic verbatim.
Target length: about ${wordsPerChapter} words (±15%).
Requirements:
1) 2–3 sentence introduction without fluff.
2) 3–5 actionable subsections with headings; each subsection has 2–4 numbered steps using concrete numbers, timers, frequencies, or percentages.
3) ${includeExamples ? "One realistic scenario matching the domain (no sales or KPI)." : ""}
4) Provide a daily/weekly tracker snippet, e.g., a 14-day table: Day/Goal/Actual/Delta.
5) 3–5 line summary.
6) Practical checklist in Markdown.
Include platform anchors when relevant:
* iOS: Screen Time, App Limits, Downtime, Focus
* Android: Digital Wellbeing, App Timers, Bedtime mode, Do Not Disturb
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
      ? `\n### กรณีตัวอย่าง\nนักศึกษาคนหนึ่งลดเวลาหน้าจอจาก 4 ชั่วโมงเหลือ 2 ชั่วโมงภายใน 14 วันด้วยเทคนิคเหล่านี้`
      : `\n### Example\nA student cut screen time from 4 hours to 2 hours in 14 days using these steps`
    : "";

  const tracker = isThai
    ? `\n\n| วัน | เป้าหมาย | ผลจริง | ส่วนต่าง |\n|---|---|---|---|\n|1| | | |\n|2| | | |\n|3| | | |\n|4| | | |\n|5| | | |\n|6| | | |\n|7| | | |\n|8| | | |\n|9| | | |\n|10| | | |\n|11| | | |\n|12| | | |\n|13| | | |\n|14| | | |`
    : `\n\n| Day | Goal | Actual | Delta |\n|---|---|---|---|\n|1| | | |\n|2| | | |\n|3| | | |\n|4| | | |\n|5| | | |\n|6| | | |\n|7| | | |\n|8| | | |\n|9| | | |\n|10| | | |\n|11| | | |\n|12| | | |\n|13| | | |\n|14| | | |`;

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

  return `${intro}\n\n${subsections.join("\n\n")}${example}${tracker}\n\n${isThai ? "สรุป:" : "Summary:"}\n${summaryLines.join("\n")}\n\n${isThai ? "Checklist:" : "Checklist:"}\n${checklist}`;
}
