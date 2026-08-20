"use client"

import { useState } from "react"
import {
  BookOpen,
  FileText,
  FlaskConical,
  GraduationCap,
  ListChecks,
  PencilRuler,
  ScrollText,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { type DocType, type StudyDoc, docTypeLabel } from "@/lib/types"
import { UploadDialog } from "@/components/upload-dialog"

const TYPE_ICONS: Record<DocType, typeof FileText> = {
  syllabus: ScrollText,
  lecture: BookOpen,
  tutorial: PencilRuler,
  midterm: FileText,
  final: GraduationCap,
  quiz: FlaskConical,
}

function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        aria-label="Delete document"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover/item:opacity-100"
      >
        <Trash2 className="size-4" />
      </button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this document?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the document and its extracted outcomes from this
            device. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              onConfirm()
              setOpen(false)
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function DocumentLibrary({
  docs,
  activeId,
  onSelect,
  onCreated,
  onDelete,
}: {
  docs: StudyDoc[]
  activeId: string | null
  onSelect: (id: string) => void
  onCreated: (doc: StudyDoc) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-3.5">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <GraduationCap className="size-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Studyle</span>
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Library
        </span>
        <UploadDialog onCreated={onCreated} />
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 px-2 pb-4">
          {docs.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              No documents yet. Upload a syllabus, lecture, or past paper to
              begin.
            </p>
          ) : (
            docs.map((doc) => {
              const Icon = TYPE_ICONS[doc.type]
              const active = doc.id === activeId
              const included = doc.outcomes.filter(
                (o) => o.status === "included",
              ).length
              return (
                <button
                  key={doc.id}
                  onClick={() => onSelect(doc.id)}
                  className={cn(
                    "group/item flex items-start gap-3 rounded-md px-2 py-2.5 text-left transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "hover:bg-sidebar-accent/50",
                  )}
                >
                  <Icon
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{doc.title}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className="h-5 px-1.5 text-[10px] font-normal"
                      >
                        {docTypeLabel(doc.type)}
                      </Badge>
                      {doc.outcomes.length > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <ListChecks className="size-3" />
                          {included}/{doc.outcomes.length}
                        </span>
                      )}
                    </div>
                  </div>
                  <DeleteButton onConfirm={() => onDelete(doc.id)} />
                </button>
              )
            })
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-sidebar-border px-4 py-3">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Documents are stored locally in your browser on this device.
        </p>
      </div>
    </div>
  )
}
