import { describe, expect, it } from "vitest";
import { missionSchema, reflectionSchema, situationRequestSchema } from "./schemas";

describe("request and response schemas", () => {
  it("validates a complete situation request", () => {
    const result = situationRequestSchema.safeParse({
      situation: "I need to explain a timeline risk in standup.",
      audience: "My product manager and engineering team",
      difficulty: "I tend to rush the opening sentence.",
      timing: "Tomorrow morning"
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
    expect(
      missionSchema.safeParse({
        title: "One clear opening",
        mission: "Pause once, then say the first sentence at a steady pace.",
        focus: "Opening pace",
        successSignal: "You finished the first sentence without restarting.",
        framing: "Keep the mission small enough to use in the real moment."
      }).success
    ).toBe(true);

    expect(
      reflectionSchema.safeParse({
        observedEvidence: ["You paused before speaking.", "The manager asked one follow-up question."],
        usefulInterpretation: "The report shows you created a small amount of room before starting.",
        nextStep: "Use the same pause before your next meeting update.",
        closing: "That is concrete evidence from one real moment."
      }).success
    ).toBe(true);
  });
});
