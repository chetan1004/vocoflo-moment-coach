import { describe, expect, it } from "vitest";
import { initialCoachStep, missionReady, reflectionReady } from "./coach-state";

const situation = {
  situation: "I will introduce a demo.",
  audience: "Build Week judges",
  difficulty: "The opening sentence feels important.",
  timing: "Demo day"
};

const mission = {
  title: "Name the demo",
  mission: "Say the product name and one sentence about what it does.",
  focus: "First sentence",
  successSignal: "The product name is spoken clearly enough to continue.",
  framing: "Use this as a short entry point."
};

describe("coach state progression", () => {
  it("starts at situation and advances through mission to reflection", () => {
    expect(initialCoachStep.kind).toBe("situation");

    const missionState = missionReady(situation, mission);
    expect(missionState.kind).toBe("mission");

    const loadingReflection = { ...missionState, kind: "loadingReflection" as const, report: "I said the name first." };
    const reflectionState = reflectionReady(loadingReflection, {
      observedEvidence: ["You said the name first."],
      usefulInterpretation: "The opening action happened.",
      nextStep: "Use the same opening sentence in the next demo.",
      closing: "That is one concrete data point."
    });

    expect(reflectionState.kind).toBe("reflection");
    expect(reflectionState.report).toBe("I said the name first.");
  });
});
