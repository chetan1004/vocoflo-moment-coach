import { z } from "zod";
import { missionSchema, reflectionSchema, reportExchangeSchema, situationRequestSchema } from "./schemas";

const HISTORY_KEY = "vocoflo.momentCoach.history.v1";

const legacyHistoryEntrySchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  situationSummary: z.string().min(1).max(220),
  situation: situationRequestSchema,
  mission: missionSchema,
  report: z.string().min(1).max(900),
  reflection: reflectionSchema
});

export const historyEntrySchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  situationSummary: z.string().min(1).max(220),
  situation: situationRequestSchema,
  mission: missionSchema,
  thread: z.array(
    reportExchangeSchema.extend({
      id: z.string().min(1),
      createdAt: z.string().datetime()
    })
  ),
  responseCount: z.number().int().min(0).max(3),
  endedReason: z.enum(["max_responses", "user_started_new"]).optional()
});

export type HistoryEntry = z.infer<typeof historyEntrySchema>;
export type HistoryThreadExchange = HistoryEntry["thread"][number];

export function buildHistoryEntry(
  input: Omit<HistoryEntry, "id" | "createdAt" | "updatedAt" | "situationSummary" | "responseCount">
): HistoryEntry {
  const now = new Date().toISOString();
  return {
    ...input,
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
    situationSummary: input.situation.situation.slice(0, 160),
    responseCount: input.thread.length
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
    const result = z.array(z.unknown()).safeParse(parsed);
    if (!result.success) {
      return [];
    }

    return result.data.map(normalizeHistoryEntry).filter((entry): entry is HistoryEntry => Boolean(entry));
  } catch {
    return [];
  }
}

export function saveCompletedLoop(entry: HistoryEntry, storage: Storage | undefined = getBrowserStorage()) {
  if (!storage) {
    return;
  }

  const existing = readHistory(storage).filter((item) => item.id !== entry.id);
  const next = [{ ...entry, updatedAt: new Date().toISOString(), responseCount: entry.thread.length }, ...existing].slice(0, 20);
  try {
    storage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Local browser storage is optional in this beta.
  }
}

function normalizeHistoryEntry(value: unknown): HistoryEntry | null {
  const modern = historyEntrySchema.safeParse(value);
  if (modern.success) {
    return modern.data;
  }

  const legacy = legacyHistoryEntrySchema.safeParse(value);
  if (!legacy.success) {
    return null;
  }

  return {
    id: legacy.data.id,
    createdAt: legacy.data.createdAt,
    updatedAt: legacy.data.createdAt,
    situationSummary: legacy.data.situationSummary,
    situation: legacy.data.situation,
    mission: legacy.data.mission,
    thread: [
      {
        id: `${legacy.data.id}-response-1`,
        createdAt: legacy.data.createdAt,
        userText: legacy.data.report,
        coachResponse: legacy.data.reflection
      }
    ],
    responseCount: 1,
    endedReason: "user_started_new"
  };
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
