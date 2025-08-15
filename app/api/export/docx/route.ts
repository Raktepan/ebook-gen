import { NextResponse } from "next/server";
import { markdownToDocx } from "../../../../lib/exporter";

export async function POST(req: Request) {
  const { markdown } = await req.json();
  const buf = await markdownToDocx(markdown || "");
  const arrayBuffer: ArrayBuffer = buf.buffer as ArrayBuffer;
  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="ebook.docx"',
    },
  });
}
