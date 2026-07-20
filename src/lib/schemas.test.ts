import { describe, expect, it } from "vitest";
import { missionSchema, reflectionSchema, reportRequestSchema, situationRequestSchema } from "./schemas";

const situation = {
  situation: "I need to explain a timeline risk in standup.",
  audience: "My product manager and engineering team",
  difficulty: "I tend to rush the opening sentence.",
  timing: "Tomorrow morning"
};

const mission = {
  title: "One clear opening",
  mission: "Say the first sentence once and continue.",
  focus: "Continuing after difficulty",
  successSignal: "You continue the sentence after a difficult word.",
  framing: "Keep the mission small enough to use in the real moment."
};

const reflection = {
  observedEvidence: ["You continued after one difficult word."],
  usefulInterpretation: "The reported evidence is limited to continuing once.",
  nextStep: "Continue one sentence in the next short update.",
  closing: "Stay with what was observed."
};

describe("request and response schemas", () => {
  it("validates a complete situation request", () => {
    const result = situationRequestSchema.safeParse({
      ...situation
    });

    expect(result.success).toBe(true);
  });

  it("rejects underspecified requests", () => {
    const result = situationRequestSchema.safeParse({
      situation: "",
      audience: "PM",
      difficulty: ""
    });

    expect(result.success).toBe(false);
  });

  it("validates structured mission and reflection outputs", () => {
    expect(missionSchema.safeParse(mission).success).toBe(true);

    expect(reflectionSchema.safeParse(reflection).success).toBe(true);
  });

  it("rejects response number 2 with zero previous responses", () => {
    expect(
      reportRequestSchema.safeParse({ situation, mission, report: "I continued once.", previousResponses: [], responseNumber: 2 })
        .success
    ).toBe(false);
  });

  it("rejects response number 1 with one previous response", () => {
    expect(
      reportRequestSchema.safeParse({
        situation,
        mission,
        report: "I want to clarify.",
        previousResponses: [{ userText: "I continued once.", coachResponse: reflection }],
        responseNumber: 1
      }).success
    ).toBe(false);
  });

  it("accepts response number 3 with two previous responses", () => {
    expect(
      reportRequestSchema.safeParse({
        situation,
        mission,
        report: "I have one last same-mission observation.",
        previousResponses: [
          { userText: "I continued once.", coachResponse: reflection },
          { userText: "I corrected one word.", coachResponse: reflection }
        ],
        responseNumber: 3
      }).success
    ).toBe(true);
  });
});
