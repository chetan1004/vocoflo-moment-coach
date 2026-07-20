import { z } from "zod";
import { missionSchema, reflectionSchema, situationRequestSchema } from "./schemas";

const HISTORY_KEY = "vocoflo.momentCoach.history.v1";

export const historyEntrySchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  situationSummary: z.string().min(1).max(220),
  situation: situationRequestSchema,
  mission: missionSchema,
  report: z.string().min(1).max(900),
  reflection: reflectionSchema
});

export type HistoryEntry = z.infer<typeof historyEntrySchema>;

export function buildHistoryEntry(input: Omit<HistoryEntry, "id" | "createdAt" | "situationSummary">): HistoryEntry {
  return {
    ...input,
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    situationSummary: input.situation.situation.slice(0, 160)
  };
}

export function readHistory(storage: Storage | undefined = getBrowserStorage()): HistoryEntry[] {
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(HISTORY_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    const result = z.array(historyEntrySchema).safeParse(parsed);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

export function saveCompletedLoop(entry: HistoryEntry, storage: Storage | undefined = getBrowserStorage()) {
  if (!storage) {
    return;
  }

  const next = [entry, ...readHistory(storage)].slice(0, 20);
  try {
    storage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Local browser storage is optional in this beta.
  }
}

export function clearHistory(storage: Storage | undefined = getBrowserStorage()) {
  try {
    storage?.removeItem(HISTORY_KEY);
  } catch {
    // Ignore unavailable storage.
  }
}

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
