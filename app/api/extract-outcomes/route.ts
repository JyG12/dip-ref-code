import { generateText, Output } from "ai"
import { z } from "zod"

export const maxDuration = 60

const outcomeSchema = z.object({
  outcomes: z
    .array(
      z.object({
        section: z
          .string()
          .describe(
            "Short topic or unit/week label this item belongs to, if any. Empty string if none.",
          ),
        text: z
          .string()
          .describe(
            "A single, concise learning outcome or table-of-contents topic.",
          ),
      }),
    )
    .describe(
      "The list of learning outcomes / table-of-contents topics found in the document.",
    ),
})

export async function POST(req: Request) {
  try {
    const { content, title } = (await req.json()) as {
      content?: string
      title?: string
    }

    if (!content || content.trim().length < 20) {
      return Response.json(
        { error: "Not enough document text to analyze." },
        { status: 400 },
      )
    }

    // Cap the amount of text sent to the model.
    const excerpt = content.slice(0, 24000)

    const { output } = await generateText({
      model: "google/gemini-3.5-flash",
      output: Output.object({ schema: outcomeSchema }),
      system:
        "You are an academic assistant. You read course material and extract a clean, " +
        "de-duplicated list of the table-of-contents topics and learning outcomes. " +
        "Prefer the document's own wording. Keep each item to one sentence or phrase. " +
        "Do not invent topics that are not supported by the text. " +
        "If the document has clear sections, weeks, or units, use them as the 'section' label.",
      prompt:
        `Document title: ${title ?? "Untitled"}\n\n` +
        `Extract the table of contents / learning outcomes from the following document text:\n\n` +
        excerpt,
    })

    return Response.json({ outcomes: output.outcomes })
  } catch (err) {
    console.error("[v0] extract-outcomes error:", err)
    return Response.json(
      { error: "Failed to extract outcomes. Please try again." },
      { status: 500 },
    )
  }
}
