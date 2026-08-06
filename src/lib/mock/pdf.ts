/** Minimal single-page PDF writer — enough for a prescription printout. */

type Line = { text: string; size: number; bold?: boolean; gap?: number };

function escapePdf(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function toBase64(input: string) {
  if (typeof btoa === "function") {
    // btoa needs latin1; the content is ASCII-safe after sanitising.
    return btoa(input);
  }
  return Buffer.from(input, "binary").toString("base64");
}

/** Builds a US-Letter PDF from a list of text lines and returns it base64-encoded. */
export function buildTextPdf(lines: Line[]): string {
  const pageHeight = 792;
  let y = pageHeight - 64;
  const parts: string[] = ["BT"];
  for (const line of lines) {
    const font = line.bold ? "/F2" : "/F1";
    const text = escapePdf(line.text.replace(/[^\x20-\x7E]/g, "-"));
    parts.push(`${font} ${line.size} Tf`, `1 0 0 1 56 ${y} Tm`, `(${text}) Tj`);
    y -= line.size + (line.gap ?? 6);
  }
  parts.push("ET");
  const stream = parts.join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return toBase64(pdf);
}
