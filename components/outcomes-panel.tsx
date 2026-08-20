"use client"

import { useMemo, useState } from "react"
import {
  ListChecks,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"
import type { LearningOutcome, StudyDoc } from "@/lib/types"

function uid() {
  return `lo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

export function OutcomesPanel({
  doc,
  onChange,
}: {
  doc: StudyDoc
  onChange: (doc: StudyDoc) => void
}) {
  const [extracting, setExtracting] = useState(false)
  const [newText, setNewText] = useState("")

  const includedCount = useMemo(
    () => doc.outcomes.filter((o) => o.status === "included").length,
    [doc.outcomes],
  )

  const grouped = useMemo(() => {
    const map = new Map<string, LearningOutcome[]>()
    for (const o of doc.outcomes) {
      const key = o.section?.trim() || "General"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(o)
    }
    return Array.from(map.entries())
  }, [doc.outcomes])

  function commit(outcomes: LearningOutcome[], extracted = doc.extracted) {
    onChange({ ...doc, outcomes, extracted, updatedAt: Date.now() })
  }

  async function runExtraction() {
    setExtracting(true)
    try {
      const res = await fetch("/api/extract-outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: doc.content, title: doc.title }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Extraction failed.")

      const extracted: LearningOutcome[] = (data.outcomes ?? []).map(
        (o: { section?: string; text: string }) => ({
          id: uid(),
          text: o.text,
          section: o.section || undefined,
          status: "included" as const,
        }),
      )

      if (extracted.length === 0) {
        toast.info("No clear outcomes were found in this document.")
      } else {
        toast.success(`Extracted ${extracted.length} learning outcomes.`)
      }
      // Keep any manually added items, replace prior AI set.
      commit(extracted, true)
    } catch (err) {
      console.error("[v0] extraction error:", err)
      toast.error(err instanceof Error ? err.message : "Extraction failed.")
    } finally {
      setExtracting(false)
    }
  }

  function toggle(id: string) {
    commit(
      doc.outcomes.map((o) =>
        o.id === id
          ? {
              ...o,
              status: o.status === "included" ? "excluded" : "included",
            }
          : o,
      ),
    )
  }

  function remove(id: string) {
    commit(doc.outcomes.filter((o) => o.id !== id))
  }

  function addManual() {
    const text = newText.trim()
    if (!text) return
    commit([
      ...doc.outcomes,
      { id: uid(), text, status: "included" },
    ])
    setNewText("")
  }

  function setAll(status: "included" | "excluded") {
    commit(doc.outcomes.map((o) => ({ ...o, status })))
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <ListChecks className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">Learning outcomes</h2>
        </div>
        {doc.outcomes.length > 0 && (
          <Badge variant="secondary" className="font-mono text-xs">
            {includedCount}/{doc.outcomes.length}
          </Badge>
        )}
      </div>

      {doc.outcomes.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-4">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Sparkles />
              </EmptyMedia>
              <EmptyTitle>Extract the syllabus</EmptyTitle>
              <EmptyDescription>
                Let AI read this document and pull out its table of contents and
                learning outcomes. Then check or uncheck what&apos;s relevant to
                you.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={runExtraction} disabled={extracting}>
                {extracting ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Sparkles data-icon="inline-start" />
                )}
                {extracting ? "Reading document…" : "Extract with AI"}
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1 border-b border-border px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAll("included")}
            >
              Select all
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAll("excluded")}
            >
              Clear
            </Button>
            <div className="ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={runExtraction}
                disabled={extracting}
              >
                {extracting ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <RefreshCw data-icon="inline-start" />
                )}
                Re-extract
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-5 p-4">
              {grouped.map(([section, items]) => (
                <div key={section} className="flex flex-col gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {section}
                  </p>
                  <ul className="flex flex-col gap-1">
                    {items.map((o) => {
                      const on = o.status === "included"
                      return (
                        <li
                          key={o.id}
                          className={cn(
                            "group flex items-start gap-3 rounded-md border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-muted/50",
                            !on && "opacity-55",
                          )}
                        >
                          <Checkbox
                            id={o.id}
                            checked={on}
                            onCheckedChange={() => toggle(o.id)}
                            className="mt-0.5"
                          />
                          <label
                            htmlFor={o.id}
                            className={cn(
                              "flex-1 cursor-pointer text-sm leading-snug",
                              !on && "line-through",
                            )}
                          >
                            {o.text}
                          </label>
                          <button
                            type="button"
                            onClick={() => remove(o.id)}
                            aria-label="Remove outcome"
                            className="mt-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex items-center gap-2 border-t border-border p-3">
            <Input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.nativeEvent.isComposing &&
                  e.keyCode !== 229
                ) {
                  e.preventDefault()
                  addManual()
                }
              }}
              placeholder="Add your own outcome…"
              className="h-9"
            />
            <Button
              size="icon"
              variant="secondary"
              onClick={addManual}
              disabled={!newText.trim()}
              aria-label="Add outcome"
            >
              <Plus />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
