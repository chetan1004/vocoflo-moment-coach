import OpenAI from "openai";
import { type ZodType } from "zod";
import {
  missionSchema,
  reflectionSchema,
  stringLimits,
  type Mission,
  type ReportExchange,
  type Reflection,
  type SituationRequest
} from "./schemas";
import { ModelOutputError } from "./model-output-error";

type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
};

const stringProperty = (description: string, maxLength: number) => ({
  type: "string",
  minLength: stringLimits.min,
  maxLength,
  description
});

export const missionJsonSchema: JsonSchema = {
  name: "speaking_mission",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["title", "mission", "focus", "successSignal", "framing"],
    properties: {
      title: stringProperty("Brief name for the single evidence mission.", stringLimits.mission.titleMax),
      mission: stringProperty("One concrete real-world action, not multiple techniques.", stringLimits.mission.missionMax),
      focus: stringProperty("The one evidence lens being tested.", stringLimits.mission.focusMax),
      successSignal: stringProperty("Observable evidence the user should notice.", stringLimits.mission.successSignalMax),
      framing: stringProperty("Short supportive framing without medical or fluency claims.", stringLimits.mission.framingMax)
    }
  }
};

export const reflectionJsonSchema: JsonSchema = {
  name: "report_reflection",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["observedEvidence", "usefulInterpretation", "nextStep", "closing"],
    properties: {
      observedEvidence: {
        type: "array",
        minItems: stringLimits.reflection.observedEvidenceMinItems,
        maxItems: stringLimits.reflection.observedEvidenceMaxItems,
        description: "One to three short direct facts from the user's report.",
        items: stringProperty("A short direct observation from the report.", stringLimits.reflection.observedEvidenceItemMax)
      },
      usefulInterpretation: stringProperty(
        "Cautious concise interpretation grounded only in observed evidence.",
        stringLimits.reflection.usefulInterpretationMax
      ),
      nextStep: stringProperty(
        "Exactly one concise next response following the current bounded-turn instructions.",
        stringLimits.reflection.nextStepMax
      ),
      closing: stringProperty("Brief closing limited to what was reported.", stringLimits.reflection.closingMax)
    }
  }
};

export type ResponsesClient = Pick<OpenAI["responses"], "create">;
export type ChatInput = Parameters<ResponsesClient["create"]>[0]["input"];

export function getOpenAIClient(): ResponsesClient {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey }).responses;
}

export function buildMissionInput(input: SituationRequest): ChatInput {
  return [
    {
      role: "system",
      content: [
        "You are VocoFlo Moment Coach, an educational speaking coach for real-world speaking moments.",
        "Create exactly one realistic real-world evidence mission, not a list of techniques.",
        "Choose one primary evidence lens from: prediction versus actual outcome; listener response; continuing after difficulty; speaking without restarting or correcting; returning attention to meaning or connection; acting despite the urge to avoid; noticing pressure to check or control; recognising that the object of checking changes while the checking movement repeats.",
        "Do not stack techniques, do not prescribe multiple missions, and do not turn the response into a course.",
        "Clearly state what observable evidence the user should notice during or after the moment.",
        "Do not invent courage, readiness, success, progress, feelings, or events.",
        "Do not diagnose, treat, promise fluent speech, claim symptom removal, or make therapy, cure, assessment, or medical claims.",
        "Use plain language and do not prematurely name larger-method concepts such as the watcher.",
        "Keep every field concise and inside the structured-output length limits.",
        "Return only valid JSON with title, mission, focus, successSignal, and framing."
      ].join(" ")
    },
    {
      role: "user",
      content: [
        `Upcoming speaking situation: ${input.situation}`,
        `Person or people involved: ${input.audience}`,
        `What feels difficult or important: ${input.difficulty}`,
        `Timing or context: ${input.timing || "not supplied"}`
      ].join("\n")
    }
  ];
}

export function buildReportInput(
  situation: SituationRequest,
  mission: Mission,
  report: string,
  previousResponses: ReportExchange[] = [],
  responseNumber = previousResponses.length + 1
): ChatInput {
  const finalResponse = responseNumber >= 3;
  const nextStepInstruction = finalResponse
    ? "For final report response number 3, nextStep must contain exactly one concrete next guided step and must not be a question."
    : "For report response numbers 1 and 2, nextStep may contain exactly one concise guided step or one useful same-mission question.";
  const closingInstruction = finalResponse
    ? "For final report response number 3, closing should briefly acknowledge that the bounded mission thread is complete without claiming progress."
    : "For report response numbers 1 and 2, closing must be brief.";

  return [
    {
      role: "system",
      content: [
        "You are VocoFlo Moment Coach, an educational speaking coach for report-back and bounded continuation after a real-world speaking mission.",
        "Help the user become less governed by checking, predicting, controlling, correcting, avoiding, and reacting to speech.",
        "Use only what the user actually reported.",
        "Preserve relevant prior context from the same mission.",
        "Extract direct observations before interpretation and separate facts from fear, prediction, or interpretation.",
        "Treat the original difficulty as the user's earlier fear, prediction, or concern, not as a fact about what happened.",
        "Compare prediction with reality only when the user supplied enough information to support that comparison.",
        "Compare the original difficulty with reality only when the actual report contains enough direct evidence.",
        "Use listener evidence or continuation evidence when present.",
        "Respond to clarification or disagreement instead of repeating a prior conclusion.",
        "Reject or redirect unrelated continuation content back to the active speaking mission.",
        "Do not praise mere completion as proof of progress.",
        "Do not invent evidence, progress, feelings, listener reactions, courage, readiness, or success.",
        nextStepInstruction,
        "Do not become a general-purpose chatbot.",
        "Avoid diagnosis, treatment, therapy, cure, assessment, fluency-removal, or medical claims.",
        "observedEvidence must contain one to three short direct facts.",
        "usefulInterpretation must remain cautious and concise.",
        finalResponse
          ? "nextStep must not end with a question mark and must not ask the user a question."
          : "nextStep may be one useful same-mission question when that is more useful than a guided step.",
        closingInstruction,
        "Return only valid JSON with observedEvidence, usefulInterpretation, nextStep, and closing."
      ].join(" ")
    },
    {
      role: "user",
      content: [
        `Upcoming speaking situation: ${situation.situation}`,
        `Person or people involved: ${situation.audience}`,
        `Original stated difficulty or fear: ${situation.difficulty}`,
        `Timing or context: ${situation.timing || "not supplied"}`,
        `Mission title: ${mission.title}`,
        `Mission action: ${mission.mission}`,
        `Mission focus: ${mission.focus}`,
        `Mission framing: ${mission.framing}`,
        `Evidence target: ${mission.successSignal}`,
        `Current report or continuation response number: ${responseNumber} of 3`,
        previousResponses.length > 0
          ? `Prior same-mission exchanges:\n${previousResponses
              .map(
                (exchange, index) =>
                  [
                    `Exchange ${index + 1} user: ${exchange.userText}`,
                    `Exchange ${index + 1} coach observed evidence: ${exchange.coachResponse.observedEvidence.join(" | ")}`,
                    `Exchange ${index + 1} coach interpretation: ${exchange.coachResponse.usefulInterpretation}`,
                    `Exchange ${index + 1} coach next step: ${exchange.coachResponse.nextStep}`,
                    `Exchange ${index + 1} coach closing: ${exchange.coachResponse.closing}`
                  ].join("\n")
              )
              .join("\n")}`
          : "Prior same-mission exchanges: none",
        `Actual user report: ${report}`
      ].join("\n")
    }
  ];
}

export async function generateMission(input: SituationRequest, client = getOpenAIClient()): Promise<Mission> {
  const response = await client.create({
    model: process.env.OPENAI_MODEL || "gpt-5.6",
    max_output_tokens: 600,
    input: buildMissionInput(input),
    text: {
      format: {
        type: "json_schema",
        ...missionJsonSchema,
        strict: true
      }
    }
  });

  return parseStructuredOutput(response, missionSchema);
}

export async function generateReflection(
  situation: SituationRequest,
  mission: Mission,
  report: string,
  previousResponses: ReportExchange[] = [],
  responseNumber = previousResponses.length + 1,
  client = getOpenAIClient()
): Promise<Reflection> {
  const response = await client.create({
    model: process.env.OPENAI_MODEL || "gpt-5.6",
    max_output_tokens: 650,
    input: buildReportInput(situation, mission, report, previousResponses, responseNumber),
    text: {
      format: {
        type: "json_schema",
        ...reflectionJsonSchema,
        strict: true
      }
    }
  });

  return parseStructuredOutput(response, reflectionSchema);
}

export function parseStructuredOutput<T>(response: unknown, schema: ZodType<T>): T {
  const outputText = (response as { output_text?: string }).output_text;
  if (typeof outputText !== "string") {
    logModelOutputError("missing_output_text");
    throw new ModelOutputError("missing_output_text");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    logModelOutputError("invalid_json");
    throw new ModelOutputError("invalid_json");
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    logModelOutputError(
      "schema_validation",
      result.error.issues.map((issue) => ({ path: issue.path, code: issue.code }))
    );
    throw new ModelOutputError("schema_validation");
  }

  return result.data;
}

function logModelOutputError(category: ModelOutputError["category"], issues?: Array<{ path: (string | number)[]; code: string }>) {
  console.warn("model_output_error", { category, issues });
}
