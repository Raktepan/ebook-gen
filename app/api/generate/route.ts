import { NextResponse } from "next/server";
import { generateChapter, generateTitleAndToc } from "../../../lib/prompt";

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
  const tocHeader = isThai ? "สารบัญ" : "Table of Contents";
  const chapterLabel = isThai ? "บทที่" : "Chapter";

  const { title, toc } = await generateTitleAndToc({
    topic,
    language,
    audience,
    tone,
    chapters,
  });

  const chaptersContent: string[] = [];

  for (let i = 0; i < chapters; i++) {
    const chapterTitle = toc[i] || `${chapterLabel} ${i + 1}`;
    const chapter = await generateChapter({
      topic,
      chapterTitle,
      language,
      audience,
      tone,
      i: i + 1,
      wordsPerChapter,
      includeExamples,
    });
    chaptersContent.push(`# ${chapterLabel} ${i + 1}: ${chapterTitle}\n\n${chapter}`);
  }

  const tocList = toc.map((t, idx) => `- ${chapterLabel} ${idx + 1}: ${t}`);
  const markdown = `# ${title}\n\n## ${tocHeader}\n${tocList.join("\n")}\n\n${chaptersContent.join("\n\n")}`;

  return NextResponse.json({ title, toc, markdown });
}
