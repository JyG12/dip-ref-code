import { openDB, type DBSchema, type IDBPDatabase } from "idb"
import type { StudyDoc } from "./types"

interface StudyDBSchema extends DBSchema {
  docs: {
    key: string
    value: StudyDoc
    indexes: { "by-updatedAt": number }
  }
}

const DB_NAME = "study-companion"
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<StudyDBSchema>> | null = null

function getDB() {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser")
  }
  if (!dbPromise) {
    dbPromise = openDB<StudyDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore("docs", { keyPath: "id" })
        store.createIndex("by-updatedAt", "updatedAt")
      },
    })
  }
  return dbPromise
}

export async function getAllDocs(): Promise<StudyDoc[]> {
  const db = await getDB()
  const docs = await db.getAllFromIndex("docs", "by-updatedAt")
  // Newest first.
  return docs.reverse()
}

export async function getDoc(id: string): Promise<StudyDoc | undefined> {
  const db = await getDB()
  return db.get("docs", id)
}

export async function putDoc(doc: StudyDoc): Promise<void> {
  const db = await getDB()
  await db.put("docs", doc)
}

export async function deleteDoc(id: string): Promise<void> {
  const db = await getDB()
  await db.delete("docs", id)
}
