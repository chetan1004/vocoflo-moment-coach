import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildHistoryEntry, clearHistory, readHistory, saveCompletedLoop } from "./history";

const situation = {
  situation: "I will ask a question in a planning meeting.",
  audience: "The sprint planning group",
  difficulty: "I want to avoid dropping the question.",
  timing: "This afternoon"
};

const mission = {
  title: "Ask once",
  mission: "Ask the question in one sentence before adding context.",
  focus: "First sentence",
  successSignal: "The question is asked out loud.",
  framing: "The goal is a small speaking action, not a perfect delivery."
};

const reflection = {
  observedEvidence: ["You asked the question before adding context."],
  usefulInterpretation: "You completed the smallest useful action.",
  nextStep: "Ask one question early in the next planning conversation.",
  closing: "The evidence came from what happened in the meeting."
};

describe("local history", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("saves completed loops and reads them back", () => {
    const entry = buildHistoryEntry({
      situation,
      mission,
      thread: [{ id: "exchange-1", createdAt: new Date().toISOString(), userText: "I asked it first.", coachResponse: reflection }]
    });

    saveCompletedLoop(entry);

    expect(readHistory()).toHaveLength(1);
    expect(readHistory()[0].mission.title).toBe("Ask once");
    expect(readHistory()[0].thread).toHaveLength(1);
  });

  it("recovers safely from malformed stored data", () => {
    localStorage.setItem("vocoflo.momentCoach.history.v1", "{bad json");

    expect(readHistory()).toEqual([]);
  });

  it("clears history", () => {
    saveCompletedLoop(
      buildHistoryEntry({
        situation,
        mission,
        thread: [{ id: "exchange-1", createdAt: new Date().toISOString(), userText: "I asked it first.", coachResponse: reflection }]
      })
    );

    clearHistory();

    expect(readHistory()).toEqual([]);
  });

  it("keeps older one-report history records readable", () => {
    const legacyRecord = {
      id: "legacy-1",
      createdAt: new Date().toISOString(),
      situationSummary: situation.situation,
      situation,
      mission,
      report: "I asked it first.",
      reflection
    };
    localStorage.setItem("vocoflo.momentCoach.history.v1", JSON.stringify([legacyRecord]));

    const [entry] = readHistory();

    expect(entry.thread[0].userText).toBe("I asked it first.");
    expect(entry.responseCount).toBe(1);
    expect(entry.endedReason).toBe("user_started_new");
  });

  it("updates the same history record as a mission continues", () => {
    const first = buildHistoryEntry({
      situation,
      mission,
      thread: [{ id: "exchange-1", createdAt: new Date().toISOString(), userText: "I asked it first.", coachResponse: reflection }]
    });
    saveCompletedLoop(first);

    saveCompletedLoop({
      ...first,
      thread: [
        ...first.thread,
        { id: "exchange-2", createdAt: new Date().toISOString(), userText: "I added a correction.", coachResponse: reflection }
      ],
      responseCount: 2
    });

    expect(readHistory()).toHaveLength(1);
    expect(readHistory()[0].thread).toHaveLength(2);
  });
});
