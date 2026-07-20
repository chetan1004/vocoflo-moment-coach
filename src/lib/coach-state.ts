import { missionThreadLimits, type Mission, type Reflection, type ReportExchange, type SituationRequest } from "./schemas";

export type CoachExchange = ReportExchange & {
  id: string;
  createdAt: string;
};

export type CoachStep =
  | { kind: "situation" }
  | { kind: "loadingMission"; situation: SituationRequest }
  | { kind: "mission"; situation: SituationRequest; mission: Mission; exchanges: CoachExchange[]; historyId?: string }
  | { kind: "continuation"; situation: SituationRequest; mission: Mission; exchanges: CoachExchange[]; historyId: string }
  | {
      kind: "loadingReflection";
      situation: SituationRequest;
      mission: Mission;
      exchanges: CoachExchange[];
      userText: string;
      historyId?: string;
    }
  | {
      kind: "reflection";
      situation: SituationRequest;
      mission: Mission;
      exchanges: CoachExchange[];
      historyId: string;
      endedReason?: "max_responses" | "user_started_new";
    };

export const initialCoachStep: CoachStep = { kind: "situation" };

export function missionReady(situation: SituationRequest, mission: Mission): CoachStep {
  return { kind: "mission", situation, mission, exchanges: [] };
}

export function reflectionReady(
  state: Extract<CoachStep, { kind: "loadingReflection" }>,
  reflection: Reflection,
  historyId: string
): Extract<CoachStep, { kind: "reflection" }> {
  const exchange = buildCoachExchange(state.userText, reflection);
  const exchanges = [...state.exchanges, exchange];

  return {
    kind: "reflection",
    situation: state.situation,
    mission: state.mission,
    exchanges,
    historyId,
    endedReason: exchanges.length >= missionThreadLimits.maxReportResponses ? "max_responses" : undefined
  };
}

export function buildCoachExchange(userText: string, coachResponse: Reflection): CoachExchange {
  return {
    id: `exchange-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    userText,
    coachResponse
  };
}
