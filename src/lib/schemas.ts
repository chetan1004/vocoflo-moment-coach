import { z } from "zod";

export const stringLimits = {
  min: 3,
  mission: {
    titleMax: 90,
    missionMax: 420,
    focusMax: 160,
    successSignalMax: 180,
    framingMax: 240
  },
  reflection: {
    observedEvidenceItemMax: 220,
    observedEvidenceMinItems: 1,
    observedEvidenceMaxItems: 3,
    usefulInterpretationMax: 300,
    nextStepMax: 220,
    closingMax: 220
  }
} as const;

const trimmedString = (label: string, max: number) =>
  z
    .string({ required_error: `${label} is required.` })
    .trim()
    .min(stringLimits.min, `${label} must include a little more detail.`)
    .max(max, `${label} must stay under ${max} characters.`);

export const situationRequestSchema = z.object({
  situation: trimmedString("Upcoming speaking situation", 700),
  audience: trimmedString("Who you will speak with", 240),
  difficulty: trimmedString("What feels difficult or important", 500),
  timing: z.string().trim().max(240, "Timing must stay under 240 characters.").optional()
});

export const missionSchema = z.object({
  title: trimmedString("Mission title", stringLimits.mission.titleMax),
  mission: trimmedString("Mission", stringLimits.mission.missionMax),
  focus: trimmedString("Focus", stringLimits.mission.focusMax),
  successSignal: trimmedString("Success signal", stringLimits.mission.successSignalMax),
  framing: trimmedString("Supportive framing", stringLimits.mission.framingMax)
});

export const reflectionSchema = z.object({
  observedEvidence: z
    .array(trimmedString("Observed evidence", stringLimits.reflection.observedEvidenceItemMax))
    .min(stringLimits.reflection.observedEvidenceMinItems)
    .max(stringLimits.reflection.observedEvidenceMaxItems),
  usefulInterpretation: trimmedString("Useful interpretation", stringLimits.reflection.usefulInterpretationMax),
  nextStep: trimmedString("Next step", stringLimits.reflection.nextStepMax),
  closing: trimmedString("Supportive closing", stringLimits.reflection.closingMax)
});

export const reportExchangeSchema = z.object({
  userText: trimmedString("Report or continuation", 900),
  coachResponse: reflectionSchema
});

export const errorResponseSchema = z.object({
  error: z.string()
});

export type SituationRequest = z.infer<typeof situationRequestSchema>;
export type Mission = z.infer<typeof missionSchema>;
export type Reflection = z.infer<typeof reflectionSchema>;
export type ReportExchange = z.infer<typeof reportExchangeSchema>;

export const missionThreadLimits = {
  missionResponseCount: 1,
  maxReportResponses: 3,
  maxTotalResponses: 4
} as const;

export const reportRequestSchema = z
  .object({
    situation: situationRequestSchema,
    mission: missionSchema,
    report: trimmedString("Report-back", 900),
    previousResponses: z.array(reportExchangeSchema).max(missionThreadLimits.maxReportResponses - 1).default([]),
    responseNumber: z
      .number()
      .int()
      .min(1)
      .max(missionThreadLimits.maxReportResponses)
  })
  .superRefine((value, context) => {
    if (value.responseNumber !== value.previousResponses.length + 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["responseNumber"],
        message: "Report response count is invalid."
      });
    }
  });

export type ReportRequest = z.infer<typeof reportRequestSchema>;
