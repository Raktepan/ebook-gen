import { Document, HeadingLevel, Packer, Paragraph } from "docx";

export async function markdownToDocx(markdown: string): Promise<Uint8Array> {
  const lines = markdown.split(/\r?\n/);
  const children: Paragraph[] = [];

  for (const line of lines) {
    if (line.startsWith("# ")) {
      children.push(
        new Paragraph({
          text: line.replace(/^#\s+/, "").trim(),
          heading: HeadingLevel.HEADING_1,
        })
      );
    } else if (line.startsWith("## ")) {
      children.push(
        new Paragraph({
          text: line.replace(/^##\s+/, "").trim(),
          heading: HeadingLevel.HEADING_2,
        })
      );
    } else if (line.startsWith("- ")) {
      children.push(
        new Paragraph({
          text: line.replace(/^-\s+/, "").trim(),
          bullet: { level: 0 },
        })
      );
    } else if (line.trim() === "") {
      children.push(new Paragraph(""));
    } else {
      children.push(new Paragraph(line));
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "TH Sarabun New",
          },
        },
      },
    },
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(doc);
}
