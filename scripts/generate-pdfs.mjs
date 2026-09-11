/**
 * Generates the placeholder PDFs served from `public/docs/`.
 *
 * It reads `src/lib/mock-data.ts` directly (Node strips the types), so the
 * seed data is the single source of truth: every `fileUrl` in the seed — on
 * documents and on their previous versions — gets a matching file on disk.
 *
 * Run with:  npm run generate:pdfs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, "..");

const { documents, documentTypes, engagements, products } = await import(
  join(projectRoot, "src/lib/mock-data.ts")
);

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 72;

/** Escapes the three characters that are special inside a PDF string. */
function pdfString(text) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Drops anything outside WinAnsi's safe ASCII range. */
function toAscii(text) {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[^\x20-\x7e]/g, "");
}

/** Helvetica is roughly 0.52em average; good enough to wrap placeholder text. */
function wrap(text, fontSize, maxWidth) {
  const charWidth = fontSize * 0.52;
  const maxChars = Math.max(8, Math.floor(maxWidth / charWidth));
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Builds a single-page PDF from an ordered list of text blocks.
 * Each block is `{ text, size, font: 'bold' | 'regular', gap }`.
 */
function buildPdf(blocks) {
  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  const parts = ["BT"];
  let cursorY = PAGE_HEIGHT - MARGIN;
  let lastFont = null;
  let lastSize = null;
  let penY = null;

  for (const block of blocks) {
    const fontRef = block.font === "bold" ? "/F1" : "/F2";
    const lines = wrap(toAscii(block.text), block.size, contentWidth);

    for (const line of lines) {
      cursorY -= block.size * 1.35;
      if (fontRef !== lastFont || block.size !== lastSize) {
        parts.push(`${fontRef} ${block.size} Tf`);
        lastFont = fontRef;
        lastSize = block.size;
      }
      if (penY === null) {
        parts.push(`1 0 0 1 ${MARGIN} ${cursorY.toFixed(2)} Tm`);
      } else {
        parts.push(`0 ${(cursorY - penY).toFixed(2)} Td`);
      }
      penY = cursorY;
      parts.push(`(${pdfString(line)}) Tj`);
    }

    cursorY -= block.gap ?? 0;
  }

  parts.push("ET");

  // A hairline rule under the letterhead.
  const rule = `0.6 w 0.75 0.78 0.76 RG ${MARGIN} ${PAGE_HEIGHT - MARGIN - 44} m ${PAGE_WIDTH - MARGIN} ${PAGE_HEIGHT - MARGIN - 44} l S`;
  const content = `${rule}\n${parts.join("\n")}`;

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      "/Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf +=
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "latin1");
}

const STATUS_LABELS = {
  pending: "Pending",
  received: "Received",
  under_review: "Under Review",
  final: "Final",
};

function documentPdf({ title, engagement, product, documentType, meta, note }) {
  const blocks = [
    { text: "BOA SAFRA AG", size: 13, font: "bold", gap: 0 },
    { text: "Harvest Hidden Tax Deductions", size: 9, font: "regular", gap: 34 },
    { text: title, size: 18, font: "bold", gap: 16 },
    { text: product, size: 11, font: "regular", gap: 0 },
    { text: `Engagement: ${engagement}`, size: 11, font: "regular", gap: 0 },
    { text: `Document type: ${documentType}`, size: 11, font: "regular", gap: 18 },
  ];

  for (const line of meta) {
    blocks.push({ text: line, size: 10, font: "regular", gap: 0 });
  }

  blocks.push({ text: "", size: 10, font: "regular", gap: 14 });
  blocks.push({
    text:
      "This is placeholder content generated for the Boa Safra Ag client portal mockup. " +
      "It stands in for the real document so that the View and Download actions work " +
      "end to end during stakeholder review.",
    size: 11,
    font: "regular",
    gap: 14,
  });

  if (note) {
    blocks.push({ text: `Note: ${note}`, size: 10, font: "regular", gap: 0 });
  }

  return buildPdf(blocks);
}

const outputs = new Map();

// Every document a client can reach needs a file, including non-final ones
// (preview-only) — but not internal work product, which the data layer never
// returns, and not documents that have merely been requested and so have no
// file yet.
//
// NOTE: `public/` is served with no authorization, so the download rule is
// enforced only in the UI here. A real deployment must serve documents through
// an authorized route handler instead.
const withFiles = documents.filter(
  (document) => document.visibility === "client" && document.fileUrl,
);

for (const document of withFiles) {
  const engagement = engagements.find((e) => e.id === document.engagementId);
  const documentType = documentTypes.find(
    (t) => t.id === document.documentTypeId,
  );
  const product = products.find((p) => p.id === engagement.productId);

  const common = {
    title: document.fileName.replace(/\.pdf$/i, ""),
    engagement: engagement.name,
    product: product.name,
    documentType: documentType.name,
  };

  outputs.set(
    document.fileUrl,
    documentPdf({
      ...common,
      meta: [
        `Version: ${document.version}`,
        `Status: ${STATUS_LABELS[document.status]}`,
        `Provided by: ${document.uploadedBy === "client" ? "Client" : "Boa Safra Ag"}`,
        `Dated: ${document.uploadedAt.slice(0, 10)}`,
      ],
    }),
  );

  for (const version of document.previousVersions ?? []) {
    outputs.set(
      version.fileUrl,
      documentPdf({
        ...common,
        meta: [
          `Version: ${version.version} (superseded)`,
          `Provided by: ${version.uploadedBy === "client" ? "Client" : "Boa Safra Ag"}`,
          `Dated: ${version.uploadedAt.slice(0, 10)}`,
        ],
        note: version.note,
      }),
    );
  }
}

for (const [url, buffer] of outputs) {
  const target = join(projectRoot, "public", url.replace(/^\//, ""));
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, buffer);
}

const internal = documents.filter((d) => d.visibility === "internal").length;
const requested = documents.filter(
  (d) => d.visibility === "client" && !d.fileUrl,
).length;
console.log(
  `Generated ${outputs.size} placeholder PDFs in public/docs/ ` +
    `(skipped ${internal} internal and ${requested} requested-but-unsupplied).`,
);
