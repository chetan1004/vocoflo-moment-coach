import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ModelOutputError } from "./model-output-error";
import {
  buildMissionInput,
  buildReportInput,
  missionJsonSchema,
  parseStructuredOutput,
  reflectionJsonSchema
} from "./openai-client";
import { reflectionSchema, stringLimits } from "./schemas";

const situation = {
  situation: "I will ask one question in a planning meeting.",
  audience: "My team lead and two teammates",
  difficulty: "I worry I will restart if the first words feel tense.",
  timing: "Tomorrow morning"
};

const mission = {
  title: "Ask before explaining",
  mission: "Ask the question in one sentence before adding context.",
  focus: "Prediction versus actual listener response",
  successSignal: "Notice whether someone responds to the meaning of the question.",
  framing: "This is one small real-world mission."
};

describe("OpenAI prompt builders", () => {
  it("requires exactly one evidence mission and forbids technique stacking or invented progress", () => {
    const prompt = JSON.stringify(buildMissionInput(situation));

    expect(prompt).toContain("exactly one realistic real-world evidence mission");
    expect(prompt).toContain("Choose one primary evidence lens");
    expect(prompt).toContain("Do not stack techniques");
    expect(prompt).toContain("observable evidence");
    expect(prompt).toContain("Do not invent courage, readiness, success, progress");
    expect(prompt).toContain("do not prematurely name larger-method concepts such as the watcher");
    expect(prompt).toContain("Do not diagnose, treat, promise fluent speech");
    expect(prompt).toContain("Keep every field concise and inside the structured-output length limits");
  });

  it("forbids invented evidence and requires exactly one next step", () => {
    const prompt = JSON.stringify(buildReportInput(situation, mission, "I asked the question and my lead answered it."));

    expect(prompt).toContain("Use only what the user actually reported");
    expect(prompt).toContain("Extract direct observations before interpretation");
    expect(prompt).toContain("separate facts from fear");
    expect(prompt).toContain("Treat the original difficulty as the user's earlier fear, prediction, or concern");
    expect(prompt).toContain("not as a fact about what happened");
    expect(prompt).toContain("Do not invent evidence");
    expect(prompt).toContain("For report response numbers 1 and 2");
    expect(prompt).toContain("one useful same-mission question");
    expect(prompt).toContain("Compare prediction with reality only when");
    expect(prompt).toContain("only when the actual report contains enough direct evidence");
    expect(prompt).toContain("Original stated difficulty or fear: I worry I will restart if the first words feel tense.");
    expect(prompt).toContain("Mission focus: Prediction versus actual listener response");
    expect(prompt).toContain("Mission framing: This is one small real-world mission.");
    expect(prompt).toContain("Evidence target: Notice whether someone responds to the meaning of the question.");
    expect(prompt).toContain("Actual user report: I asked the question and my lead answered it.");
    expect(prompt).toContain("observedEvidence must contain one to three short direct facts");
    expect(prompt).toContain("usefulInterpretation must remain cautious and concise");
    expect(prompt).toContain("nextStep may be one useful same-mission question");
    expect(prompt).toContain("closing must be brief");
  });

  it("includes prior mission context in continuation prompt construction", () => {
    const prompt = JSON.stringify(
      buildReportInput(
        situation,
        mission,
        "Actually, I restarted twice, not once.",
        [
          {
            userText: "I asked the question but restarted once.",
            coachResponse: {
              observedEvidence: ["You asked the question.", "You restarted once."],
              usefulInterpretation: "The report shows both action and restarting.",
              nextStep: "Try one direct question without returning to the beginning.",
              closing: "Stay with what was observed."
            }
          }
        ],
        2
      )
    );

    expect(prompt).toContain("Preserve relevant prior context from the same mission");
    expect(prompt).toContain("Current report or continuation response number: 2 of 3");
    expect(prompt).toContain("Exchange 1 user: I asked the question but restarted once.");
    expect(prompt).toContain("Actually, I restarted twice, not once.");
  });

  it("allows one useful same-mission question for a non-final response", () => {
    const prompt = JSON.stringify(buildReportInput(situation, mission, "I continued once.", [], 1));

    expect(prompt).toContain("For report response numbers 1 and 2");
    expect(prompt).toContain("one useful same-mission question");
    expect(prompt).not.toContain("nextStep must not end with a question mark");
  });

  it("forbids a question and requires one guided step for the final response", () => {
    const prompt = JSON.stringify(
      buildReportInput(
        situation,
        mission,
        "I added the final same-mission observation.",
        [
          {
            userText: "I asked once.",
            coachResponse: {
              observedEvidence: ["You asked once."],
              usefulInterpretation: "The report supports that one ask happened.",
              nextStep: "Notice one listener response next time.",
              closing: "Stay with what happened."
            }
          },
          {
            userText: "I restarted once.",
            coachResponse: {
              observedEvidence: ["You restarted once."],
              usefulInterpretation: "The report supports one restart.",
              nextStep: "Continue one sentence without returning to the start.",
              closing: "Stay with what happened."
            }
          }
        ],
        3
      )
    );

    expect(prompt).toContain("For final report response number 3");
    expect(prompt).toContain("nextStep must contain exactly one concrete next guided step");
    expect(prompt).toContain("must not be a question");
    expect(prompt).toContain("nextStep must not end with a question mark");
    expect(prompt).toContain("bounded mission thread is complete without claiming progress");
  });

  it("constrains unrelated continuation content back to the active mission", () => {
    const prompt = JSON.stringify(buildReportInput(situation, mission, "Can you help me plan a vacation instead?", [], 1));

    expect(prompt).toContain("Reject or redirect unrelated continuation content back to the active speaking mission");
    expect(prompt).toContain("Do not become a general-purpose chatbot");
  });

  it("keeps mission JSON schema limits synchronized with mission schema limits", () => {
    const properties = missionJsonSchema.schema.properties as Record<string, { minLength: number; maxLength: number }>;

    expect(properties.title).toMatchObject({ minLength: stringLimits.min, maxLength: stringLimits.mission.titleMax });
    expect(properties.mission).toMatchObject({ minLength: stringLimits.min, maxLength: stringLimits.mission.missionMax });
    expect(properties.focus).toMatchObject({ minLength: stringLimits.min, maxLength: stringLimits.mission.focusMax });
    expect(properties.successSignal).toMatchObject({
      minLength: stringLimits.min,
      maxLength: stringLimits.mission.successSignalMax
    });
    expect(properties.framing).toMatchObject({ minLength: stringLimits.min, maxLength: stringLimits.mission.framingMax });
  });

  it("keeps reflection JSON schema limits synchronized with reflection schema limits", () => {
    const properties = reflectionJsonSchema.schema.properties as Record<string, { minLength?: number; maxLength?: number; minItems?: number; maxItems?: number; items?: { minLength: number; maxLength: number } }>;

    expect(properties.observedEvidence).toMatchObject({
      minItems: stringLimits.reflection.observedEvidenceMinItems,
      maxItems: stringLimits.reflection.observedEvidenceMaxItems,
      items: {
        minLength: stringLimits.min,
        maxLength: stringLimits.reflection.observedEvidenceItemMax
      }
    });
    expect(properties.usefulInterpretation).toMatchObject({
      minLength: stringLimits.min,
      maxLength: stringLimits.reflection.usefulInterpretationMax
    });
    expect(properties.nextStep).toMatchObject({ minLength: stringLimits.min, maxLength: stringLimits.reflection.nextStepMax });
    expect(properties.closing).toMatchObject({ minLength: stringLimits.min, maxLength: stringLimits.reflection.closingMax });
  });

  it("classifies missing structured output as a model output error", () => {
    expect(() => parseStructuredOutput({}, reflectionSchema)).toThrow(ModelOutputError);
  });

  it("classifies malformed model JSON as a model output error", () => {
    expect(() => parseStructuredOutput({ output_text: "{not-json" }, reflectionSchema)).toThrow(ModelOutputError);
  });

  it("classifies response schema drift as a model output error", () => {
    const oversizedReflection = {
      observedEvidence: ["A direct fact from the report."],
      usefulInterpretation: "x".repeat(stringLimits.reflection.usefulInterpretationMax + 1),
      nextStep: "Try one short direct ask next time.",
      closing: "Stay with what was observed."
    };

    expect(() => parseStructuredOutput({ output_text: JSON.stringify(oversizedReflection) }, reflectionSchema)).toThrow(
      ModelOutputError
    );
  });

  it("returns parsed data when structured output matches the schema", () => {
    const parsed = parseStructuredOutput(
      {
        output_text: JSON.stringify({
          observedEvidence: ["The teammate responded to the update."],
          usefulInterpretation: "The report supports that the conversation continued.",
          nextStep: "Continue one sentence without correcting it in the next short update.",
          closing: "Keep this tied to what happened."
        })
      },
      reflectionSchema
    );

    expect(parsed.nextStep).toContain("Continue one sentence");
    expect(() => parseStructuredOutput({ output_text: "{}" }, z.object({ ok: z.literal(true) }))).toThrow(
      ModelOutputError
    );
  });
});
