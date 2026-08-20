"use client"

/**
 * Client-side text extraction from uploaded course documents.
 * Supports PDF, DOCX, and plain text / markdown files.
 */

export interface ExtractResult {
  content: string
  mimeType: string
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist")
  // Point the worker at the bundled module so it works under Turbopack.
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString()

  const buffer = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: buffer }).promise
  const pages: string[] = []

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const textContent = await page.getTextContent()
    const strings = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .filter(Boolean)
    pages.push(strings.join(" "))
  }

  return pages.join("\n\n")
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth")
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

async function extractPlainText(file: File): Promise<string> {
  return file.text()
}

export async function extractText(file: File): Promise<ExtractResult> {
  const name = file.name.toLowerCase()
  const mimeType = file.type || "application/octet-stream"

  if (name.endsWith(".pdf") || mimeType === "application/pdf") {
    return { content: await extractPdf(file), mimeType: "application/pdf" }
  }

  if (
    name.endsWith(".docx") ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return { content: await extractDocx(file), mimeType: "docx" }
  }

  if (
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".markdown") ||
    mimeType.startsWith("text/")
  ) {
    return { content: await extractPlainText(file), mimeType: "text/plain" }
  }

  throw new Error(
    "Unsupported file type. Please upload a PDF, DOCX, TXT, or Markdown file.",
  )
}
