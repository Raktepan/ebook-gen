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

  const tocArray = Array.from({ length: chapters }, (_, idx) =>
    toc[idx] || `${chapterLabel} ${idx + 1}`
  );

  const chaptersContent = await Promise.all(
    tocArray.map((chapterTitle, idx) =>
      generateChapter({
        topic,
        chapterTitle,
        language,
        audience,
        tone,
        i: idx + 1,
        wordsPerChapter,
        includeExamples,
      }).then(
        (chapter) => `# ${chapterLabel} ${idx + 1}: ${chapterTitle}\n\n${chapter}`
      )
    )
  );

  const tocList = tocArray.map((t, idx) => `- ${chapterLabel} ${idx + 1}: ${t}`);
  const markdown = `# ${title}\n\n## ${tocHeader}\n${tocList.join("\n")}\n\n${chaptersContent.join("\n\n")}`;

  return NextResponse.json({ title, toc, markdown });
}
