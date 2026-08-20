"use client"

import { useEffect, useMemo, useState } from "react"
import { GraduationCap, ListChecks, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { DocumentLibrary } from "@/components/document-library"
import { DocumentViewer } from "@/components/document-viewer"
import { OutcomesPanel } from "@/components/outcomes-panel"
import { UploadDialog } from "@/components/upload-dialog"
import { deleteDoc, getAllDocs, putDoc } from "@/lib/db"
import { docTypeLabel, type StudyDoc } from "@/lib/types"

export function StudyApp() {
  const [docs, setDocs] = useState<StudyDoc[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [outcomesOpen, setOutcomesOpen] = useState(false)

  useEffect(() => {
    getAllDocs()
      .then((stored) => {
        setDocs(stored)
        if (stored.length > 0) setActiveId(stored[0].id)
      })
      .catch((err) => console.error("[v0] load docs error:", err))
      .finally(() => setLoading(false))
  }, [])

  const activeDoc = useMemo(
    () => docs.find((d) => d.id === activeId) ?? null,
    [docs, activeId],
  )

  function handleCreated(doc: StudyDoc) {
    setDocs((prev) => [doc, ...prev])
    setActiveId(doc.id)
    setLibraryOpen(false)
  }

  async function handleDelete(id: string) {
    await deleteDoc(id)
    setDocs((prev) => {
      const next = prev.filter((d) => d.id !== id)
      if (id === activeId) setActiveId(next[0]?.id ?? null)
      return next
    })
  }

  async function handleUpdate(doc: StudyDoc) {
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? doc : d)))
    try {
      await putDoc(doc)
    } catch (err) {
      console.error("[v0] update doc error:", err)
    }
  }

  function handleSelect(id: string) {
    setActiveId(id)
    setLibraryOpen(false)
  }

  const library = (
    <DocumentLibrary
      docs={docs}
      activeId={activeId}
      onSelect={handleSelect}
      onCreated={handleCreated}
      onDelete={handleDelete}
    />
  )

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      {/* Desktop library */}
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border md:block">
        {library}
      </aside>

      {/* Mobile library sheet */}
      <Sheet open={libraryOpen} onOpenChange={setLibraryOpen}>
        <SheetContent side="left" className="w-72 p-0 sm:max-w-72">
          <SheetHeader className="sr-only">
            <SheetTitle>Document library</SheetTitle>
          </SheetHeader>
          {library}
        </SheetContent>
      </Sheet>

      {/* Main column */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setLibraryOpen(true)}
            aria-label="Open library"
          >
            <Menu />
          </Button>

          <div className="min-w-0 flex-1">
            {activeDoc ? (
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="truncate text-base font-semibold">
                  {activeDoc.title}
                </h1>
                <Badge variant="secondary" className="shrink-0">
                  {docTypeLabel(activeDoc.type)}
                </Badge>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">
                No document selected
              </span>
            )}
          </div>

          {activeDoc && (
            <Button
              variant="outline"
              size="sm"
              className="xl:hidden"
              onClick={() => setOutcomesOpen(true)}
            >
              <ListChecks data-icon="inline-start" />
              Outcomes
            </Button>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6 md:p-10">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="mt-4 h-40 w-full" />
            </div>
          ) : activeDoc ? (
            <div className="p-6 md:p-10">
              <DocumentViewer content={activeDoc.content} />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-6">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <GraduationCap />
                  </EmptyMedia>
                  <EmptyTitle>Build your study library</EmptyTitle>
                  <EmptyDescription>
                    Upload a syllabus, lecture notes, tutorial, or past paper.
                    Read it with full math support, then let AI extract your
                    learning outcomes.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <UploadDialog onCreated={handleCreated} />
                </EmptyContent>
              </Empty>
            </div>
          )}
        </div>
      </main>

      {/* Desktop outcomes panel */}
      {activeDoc && (
        <aside className="hidden w-80 shrink-0 border-l border-border xl:block">
          <OutcomesPanel doc={activeDoc} onChange={handleUpdate} />
        </aside>
      )}

      {/* Mobile / tablet outcomes sheet */}
      {activeDoc && (
        <Sheet open={outcomesOpen} onOpenChange={setOutcomesOpen}>
          <SheetContent side="right" className="w-full p-0 sm:max-w-md">
            <SheetHeader className="sr-only">
              <SheetTitle>Learning outcomes</SheetTitle>
            </SheetHeader>
            <OutcomesPanel doc={activeDoc} onChange={handleUpdate} />
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
