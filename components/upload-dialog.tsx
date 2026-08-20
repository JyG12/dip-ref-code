"use client"

import { useRef, useState } from "react"
import { FileUp, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { DOC_TYPES, type DocType, type StudyDoc } from "@/lib/types"
import { extractText } from "@/lib/extract-text"
import { putDoc } from "@/lib/db"

function uid() {
  return `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function UploadDialog({
  onCreated,
}: {
  onCreated: (doc: StudyDoc) => void
}) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<DocType>("lecture")
  const [title, setTitle] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setType("lecture")
    setTitle("")
    setFile(null)
    setBusy(false)
    if (inputRef.current) inputRef.current.value = ""
  }

  function pickFile(f: File | null) {
    setFile(f)
    if (f && !title) {
      setTitle(f.name.replace(/\.[^.]+$/, ""))
    }
  }

  async function handleSubmit() {
    if (!file) {
      toast.error("Choose a file to upload first.")
      return
    }
    setBusy(true)
    try {
      const { content, mimeType } = await extractText(file)
      const buffer = await file.arrayBuffer()
      const now = Date.now()
      const doc: StudyDoc = {
        id: uid(),
        title: title.trim() || file.name,
        type,
        fileName: file.name,
        mimeType,
        content,
        fileData: buffer,
        outcomes: [],
        extracted: false,
        createdAt: now,
        updatedAt: now,
      }
      await putDoc(doc)
      onCreated(doc)
      toast.success("Document added to your library.")
      setOpen(false)
      reset()
    } catch (err) {
      console.error("[v0] upload error:", err)
      toast.error(
        err instanceof Error ? err.message : "Could not read that file.",
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm">
            <Upload data-icon="inline-start" />
            Upload
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload a course document</DialogTitle>
          <DialogDescription>
            PDF, Word (.docx), or plain text / Markdown. Text is read in your
            browser and stored locally on this device.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel>Document type</FieldLabel>
            <ToggleGroup
              value={[type]}
              onValueChange={(v: string[]) => {
                const next = v[0] as DocType | undefined
                if (next) setType(next)
              }}
              variant="outline"
              size="sm"
              className="flex-wrap"
            >
              {DOC_TYPES.map((t) => (
                <ToggleGroupItem key={t.value} value={t.value}>
                  {t.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>

          <Field>
            <FieldLabel htmlFor="doc-title">Title</FieldLabel>
            <Input
              id="doc-title"
              placeholder="e.g. Week 3 — Derivatives"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel>File</FieldLabel>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-input bg-muted/40 px-4 py-8 text-center transition-colors hover:bg-muted",
                file && "border-primary/50 bg-primary/5",
              )}
            >
              <FileUp className="size-6 text-muted-foreground" />
              <span className="text-sm font-medium">
                {file ? file.name : "Click to choose a file"}
              </span>
              <span className="text-xs text-muted-foreground">
                {file
                  ? `${(file.size / 1024).toFixed(0)} KB`
                  : "PDF, DOCX, TXT, or MD"}
              </span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md,.markdown,application/pdf,text/plain"
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={busy || !file}>
            {busy && <Loader2 data-icon="inline-start" className="animate-spin" />}
            {busy ? "Reading…" : "Add document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
