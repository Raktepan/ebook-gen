import { NextResponse } from "next/server";
import { generateChapter } from "../../../lib/prompt";

export async function POST(req: Request) {
  const {
    topic,
    language,
    audience,
    tone,
    chapters,
    wordsPerChapter,
    includeExamples,
  } = await req.json();

  const isThai = language === "th";
  const title = isThai ? `หนังสือเกี่ยวกับ ${topic}` : `Ebook about ${topic}`;
  const tocHeader = isThai ? "สารบัญ" : "Table of Contents";
  const chapterLabel = isThai ? "บทที่" : "Chapter";

  const toc: string[] = [];
  const content: string[] = [];

  for (let i = 1; i <= chapters; i++) {
    toc.push(`- ${chapterLabel} ${i}`);
    const chapter = await generateChapter({
      topic,
      language,
      audience,
      tone,
      i,
      wordsPerChapter,
      includeExamples,
    });
    content.push(`# ${chapterLabel} ${i}\n\n${chapter}`);
  }

  const markdown = `# ${title}\n\n## ${tocHeader}\n${toc.join("\n")}\n\n${content.join("\n\n")}`;

  return NextResponse.json({ markdown });
}
