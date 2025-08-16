import { NextResponse } from "next/server";
import {
  Style,
  generateChapter,
  generateTitleAndToc,
} from "../../../lib/prompt";

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

  const { title, toc } = await generateTitleAndToc({
    topic,
    language,
    audience,
    tone,
    style,
    chapters,
  });

  const tocArray = Array.from({ length: chapters }, (_, idx) =>
    toc[idx] || `${chapterLabel} ${idx + 1}`
  );

  const chaptersContent: string[] = [];
  for (let idx = 0; idx < tocArray.length; idx++) {
    const chapterTitle = tocArray[idx];
    const chapter = await generateChapter({
      topic,
      chapterTitle,
      language,
      audience,
      tone,
      style,
      i: idx + 1,
      wordsPerChapter,
      includeExamples,
    });
    chaptersContent.push(`# ${chapterLabel} ${idx + 1}: ${chapterTitle}\n\n${chapter}`);
  }

  const tocList = tocArray.map((t, idx) => `- ${chapterLabel} ${idx + 1}: ${t}`);
  const markdown = `# ${title}\n\n## ${tocHeader}\n${tocList.join("\n")}\n\n${chaptersContent.join("\n\n")}`;

  return NextResponse.json({ title, toc, markdown });
}
