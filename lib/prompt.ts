import OpenAI from "openai";

export interface GenerateChapterParams {
  topic: string;
  language: "th" | "en";
  audience: string;
  tone: "friendly" | "professional";
  i: number;
  wordsPerChapter: number;
  includeExamples: boolean;
}

export async function generateChapter({
  topic,
  language,
  audience,
  tone,
  i,
  wordsPerChapter,
  includeExamples,
}: GenerateChapterParams): Promise<string> {
  const langLabel = language === "th" ? "Thai" : "English";
  const toneLabel = tone === "friendly" ? (language === "th" ? "เป็นกันเอง" : "friendly") : (language === "th" ? "เป็นทางการ" : "professional");
  const exampleLabel = includeExamples
    ? language === "th"
      ? "และยกตัวอย่างที่เกี่ยวข้อง"
      : "and include relevant examples"
    : language === "th"
    ? "และไม่ต้องยกตัวอย่าง"
    : "and no examples";

  const prompt = `Write chapter ${i} of an eBook about "${topic}" in ${langLabel}.
Target audience: ${audience}.
Tone: ${toneLabel}.
Around ${wordsPerChapter} words ${exampleLabel}.
Structure:
- Introduction
- Bullet points
${includeExamples ? "- Examples\n" : ""}- Summary (3-5 sentences)`;

  if (process.env.OPENAI_API_KEY) {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    return res.choices[0].message?.content?.trim() ?? "";
  }

  const intro = language === "th"
    ? `ในบทที่ ${i} เราจะพูดถึง ${topic} สำหรับผู้อ่านกลุ่ม ${audience}.`
    : `In chapter ${i}, we discuss ${topic} for ${audience}.`;
  const bullets = language === "th"
    ? "- ประเด็นสำคัญ 1\n- ประเด็นสำคัญ 2\n- ประเด็นสำคัญ 3"
    : "- Key point 1\n- Key point 2\n- Key point 3";
  const example = includeExamples
    ? language === "th"
      ? "\n\n**ตัวอย่าง:** ตัวอย่างประกอบเนื้อหา."
      : "\n\n**Example:** An example related to the topic."
    : "";
  const summary = language === "th"
    ? "\n\nสรุป:\n- สรุปสั้น ๆ 1\n- สรุปสั้น ๆ 2\n- สรุปสั้น ๆ 3"
    : "\n\nSummary:\n- Short summary 1\n- Short summary 2\n- Short summary 3";

  return `${intro}\n\n${bullets}${example}${summary}`;
}
