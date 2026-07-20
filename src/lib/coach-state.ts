import type { Mission, Reflection, SituationRequest } from "./schemas";

export type CoachStep =
  | { kind: "situation" }
  | { kind: "loadingMission"; situation: SituationRequest }
  | { kind: "mission"; situation: SituationRequest; mission: Mission }
  | { kind: "loadingReflection"; situation: SituationRequest; mission: Mission; report: string }
  | {
      kind: "reflection";
      situation: SituationRequest;
      mission: Mission;
      report: string;
      reflection: Reflection;
    };

export const initialCoachStep: CoachStep = { kind: "situation" };

export function missionReady(situation: SituationRequest, mission: Mission): CoachStep {
  return { kind: "mission", situation, mission };
}

export function reflectionReady(
  state: Extract<CoachStep, { kind: "loadingReflection" }>,
  reflection: Reflection
): Extract<CoachStep, { kind: "reflection" }> {
  return {
    kind: "reflection",
    situation: state.situation,
    mission: state.mission,
    report: state.report,
    reflection
  };
}
