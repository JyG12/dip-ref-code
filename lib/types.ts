export type DocType =
  | "syllabus"
  | "lecture"
  | "tutorial"
  | "midterm"
  | "final"
  | "quiz"

export const DOC_TYPES: { value: DocType; label: string; hint: string }[] = [
  { value: "syllabus", label: "Syllabus", hint: "Course outline & schedule" },
  { value: "lecture", label: "Lecture", hint: "Lecture notes or slides" },
  { value: "tutorial", label: "Tutorial", hint: "Tutorial / lab sheet" },
  { value: "midterm", label: "Midterm Paper", hint: "Past midterm exam" },
  { value: "final", label: "Final Paper", hint: "Past final exam" },
  { value: "quiz", label: "Quiz", hint: "Quiz or short test" },
]

export type OutcomeStatus = "included" | "excluded"

export interface LearningOutcome {
  id: string
  text: string
  /** Optional short topic/section label the outcome belongs to. */
  section?: string
  status: OutcomeStatus
}

export interface StudyDoc {
  id: string
  title: string
  type: DocType
  fileName: string
  mimeType: string
  /** Extracted plain text / markdown used for rendering + AI. */
  content: string
  /** Raw file bytes so the original is preserved in the browser. */
  fileData?: ArrayBuffer
  outcomes: LearningOutcome[]
  /** Whether AI outcome extraction has been run. */
  extracted: boolean
  createdAt: number
  updatedAt: number
}

export function docTypeLabel(type: DocType): string {
  return DOC_TYPES.find((d) => d.value === type)?.label ?? type
}
