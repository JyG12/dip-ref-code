"use client"

import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import remarkGfm from "remark-gfm"
import rehypeKatex from "rehype-katex"

export function DocumentViewer({ content }: { content: string }) {
  const trimmed = content?.trim() ?? ""

  if (!trimmed) {
    return (
      <p className="text-muted-foreground italic">
        No readable text was extracted from this document.
      </p>
    )
  }

  return (
    <article className="doc-prose max-w-3xl">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false }]]}
      >
        {trimmed}
      </ReactMarkdown>
    </article>
  )
}
