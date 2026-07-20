"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { buildHistoryEntry, clearHistory, readHistory, saveCompletedLoop, type HistoryEntry } from "@/lib/history";
import { buildCoachExchange, initialCoachStep, missionReady, type CoachExchange, type CoachStep } from "@/lib/coach-state";
import type { Mission, Reflection, SituationRequest } from "@/lib/schemas";
import { missionThreadLimits } from "@/lib/schemas";

type SituationForm = SituationRequest;

const emptySituation: SituationForm = {
  situation: "",
  audience: "",
  difficulty: "",
  timing: ""
};

export default function Home() {
  const [step, setStep] = useState<CoachStep>(initialCoachStep);
  const [situation, setSituation] = useState<SituationForm>(emptySituation);
  const [report, setReport] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  const canContinue = step.kind === "reflection" && step.exchanges.length < missionThreadLimits.maxReportResponses;
  const finalResponse = step.kind === "reflection" && step.exchanges.length >= missionThreadLimits.maxReportResponses;

  async function handleMissionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStep({ kind: "loadingMission", situation });

    try {
      const response = await fetch("/api/mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(situation)
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to generate a mission.");
      }
      setStep(missionReady(situation, payload.mission as Mission));
    } catch (missionError) {
      setStep({ kind: "situation" });
      setError(missionError instanceof Error ? missionError.message : "Unable to generate a mission.");
    }
  }

  async function handleReportSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step.kind !== "mission" && step.kind !== "continuation") {
      return;
    }

    setError("");
    const loadingState: Extract<CoachStep, { kind: "loadingReflection" }> = {
      kind: "loadingReflection",
      situation: step.situation,
      mission: step.mission,
      exchanges: step.exchanges,
      userText: report,
      historyId: step.historyId
    };
    setStep(loadingState);

    try {
      const responseNumber = step.exchanges.length + 1;
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          situation: step.situation,
          mission: step.mission,
          report,
          previousResponses: step.exchanges.map(({ userText, coachResponse }) => ({ userText, coachResponse })),
          responseNumber
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to review your report.");
      }

      const nextExchange = buildCoachExchange(report, payload.reflection as Reflection);
      const exchanges = [...step.exchanges, nextExchange];
      const endedReason = exchanges.length >= missionThreadLimits.maxReportResponses ? "max_responses" : undefined;
      const historyId = persistThread(step.situation, step.mission, exchanges, endedReason, step.historyId);
      const nextState: Extract<CoachStep, { kind: "reflection" }> = {
        kind: "reflection",
        situation: step.situation,
        mission: step.mission,
        exchanges,
        historyId,
        endedReason
      };
      setStep(nextState);
      setReport("");
    } catch (reportError) {
      setStep(step);
      setError(reportError instanceof Error ? reportError.message : "Unable to review your report.");
    }
  }

  function startAgain() {
    if (step.kind === "mission" || step.kind === "continuation" || step.kind === "reflection") {
      persistThread(
        step.situation,
        step.mission,
        step.exchanges,
        step.kind === "reflection" && step.endedReason ? step.endedReason : "user_started_new",
        step.historyId
      );
    }
    setStep(initialCoachStep);
    setSituation(emptySituation);
    setReport("");
    setError("");
  }

  function continueMission() {
    if (step.kind !== "reflection" || step.exchanges.length >= missionThreadLimits.maxReportResponses) {
      return;
    }

    setReport("");
    setError("");
    setStep({
      kind: "continuation",
      situation: step.situation,
      mission: step.mission,
      exchanges: step.exchanges,
      historyId: step.historyId
    });
  }

  function persistThread(
    threadSituation: SituationRequest,
    threadMission: Mission,
    exchanges: CoachExchange[],
    endedReason?: "max_responses" | "user_started_new",
    historyId?: string
  ) {
    const existing = historyId ? readHistory().find((entry) => entry.id === historyId) : undefined;
    const entry: HistoryEntry = existing
      ? {
          ...existing,
          situation: threadSituation,
          mission: threadMission,
          thread: exchanges,
          responseCount: exchanges.length,
          endedReason
        }
      : buildHistoryEntry({
          situation: threadSituation,
          mission: threadMission,
          thread: exchanges,
          endedReason
        });

    saveCompletedLoop(entry);
    setHistory(readHistory());
    return entry.id;
  }

  function handleClearHistory() {
    if (window.confirm("Clear local Moment Coach history from this browser?")) {
      clearHistory();
      setHistory([]);
    }
  }

  return (
    <main className="shell">
      <section className="intro">
        <div>
          <p className="eyebrow">OpenAI Build Week 2026 beta</p>
          <p className="disclaimer">Built with GPT-5.6 and Codex.</p>
          <h1>VocoFlo Moment Coach</h1>
          <p className="audience">Real-world speaking coaching for people who stutter.</p>
          <p className="lede">
            Plan one upcoming speaking moment, try one bounded evidence mission, then report back to compare what fear
            predicted with what actually happened and take one next step.
          </p>
          <p className="disclaimer">
            Each mission is deliberately bounded: one mission, up to three report-backs, then a clear close. You can start a new mission at any time.
          </p>
          <p className="disclaimer">
            Educational speaking coaching only. This beta does not diagnose, treat, cure, record speech, or assess medical conditions.
          </p>
        </div>
        <FeatureBands />
      </section>

      <section className="workspace" aria-live="polite">
        <div className="panel">
          <Progress step={step.kind} />
          {error ? <div className="error" role="alert">{error}</div> : null}

          {(step.kind === "situation" || step.kind === "loadingMission") && (
            <SituationFormView
              value={situation}
              loading={step.kind === "loadingMission"}
              onChange={setSituation}
              onSubmit={handleMissionSubmit}
            />
          )}

          {(step.kind === "mission" ||
            step.kind === "continuation" ||
            step.kind === "loadingReflection" ||
            step.kind === "reflection") && (
            <MissionView mission={step.mission} />
          )}

          {(step.kind === "continuation" || step.kind === "loadingReflection" || step.kind === "reflection") && (
            <ThreadView exchanges={step.exchanges} />
          )}

          {(step.kind === "mission" || step.kind === "continuation" || step.kind === "loadingReflection") && (
            <ReportFormView
              value={report}
              loading={step.kind === "loadingReflection"}
              responseNumber={step.exchanges.length + 1}
              onChange={setReport}
              onSubmit={handleReportSubmit}
            />
          )}

          {(step.kind === "mission" || step.kind === "continuation") && (
            <div className="thread-actions">
              <button className="secondary" type="button" onClick={startAgain}>Start a new mission</button>
            </div>
          )}

          {step.kind === "reflection" && (
            <ThreadActions
              responseCount={step.exchanges.length}
              canContinue={canContinue}
              finalResponse={finalResponse}
              onContinue={continueMission}
              onStartAgain={startAgain}
            />
          )}
        </div>
      </section>

      <section className="method" aria-labelledby="direction-title">
        <h2 id="direction-title">The direction</h2>
        <p>
          This coach is not trying to make every sentence perfect, and it will not score your speech or hand you a pile of techniques. It helps you notice the loop that can make speaking feel high-stakes: checking, predicting, controlling, correcting, avoiding, and reacting to your speech.
        </p>
        <p>
          The coach moves you forward through your own evidence. One real speaking moment at a time, it helps you compare what fear predicted with what actually happened, notice whether you continued and how the listener responded, and gradually become less governed by the urge to monitor every word.
        </p>
        <p className="disclaimer">
          In the larger VocoFlo journey, this observing-and-checking movement is later called &apos;the watcher&apos; — after you have begun to recognise it for yourself.
        </p>
      </section>

      <HistoryPanel history={history} onClear={handleClearHistory} />
    </main>
  );
}

function FeatureBands() {
  return (
    <div className="feature-grid">
      <section>
        <h2>Works in this beta</h2>
        <ul>
          <li>Text-based upcoming-moment coaching</li>
          <li>One AI-generated mission</li>
          <li>Report-back evidence</li>
          <li>One next step</li>
          <li>Local browser history</li>
        </ul>
      </section>
      <section>
        <h2>Planned for VocoFlo</h2>
        <ul>
          <li>Speech recording and speech-event analysis</li>
          <li>Longer guided learning paths</li>
          <li>Deeper progress patterns and personalization</li>
        </ul>
      </section>
    </div>
  );
}

function Progress({ step }: { step: CoachStep["kind"] }) {
  const stages = ["Situation", "Mission", "Report", "Next step"];
  const activeIndex = useMemo(() => {
    if (step === "situation" || step === "loadingMission") return 0;
    if (step === "mission" || step === "loadingReflection") return step === "mission" ? 1 : 2;
    return 3;
  }, [step]);

  return (
    <ol className="progress" aria-label="Moment Coach progress">
      {stages.map((stage, index) => (
        <li className={index <= activeIndex ? "active" : ""} key={stage}>{stage}</li>
      ))}
    </ol>
  );
}

function SituationFormView({
  value,
  loading,
  onChange,
  onSubmit
}: {
  value: SituationForm;
  loading: boolean;
  onChange: (value: SituationForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="flow" onSubmit={onSubmit}>
      <label>
        Upcoming speaking situation
        <textarea
          required
          minLength={3}
          maxLength={700}
          value={value.situation}
          onChange={(event) => onChange({ ...value, situation: event.target.value })}
          placeholder="Example: I need to introduce my project in tomorrow's team meeting."
        />
      </label>
      <div className="field-row">
        <label>
          Who will you speak with?
          <input
            required
            minLength={3}
            maxLength={240}
            value={value.audience}
            onChange={(event) => onChange({ ...value, audience: event.target.value })}
            placeholder="Manager, team, customer, class"
          />
        </label>
        <label>
          Timing or context
          <input
            maxLength={240}
            value={value.timing}
            onChange={(event) => onChange({ ...value, timing: event.target.value })}
            placeholder="Today, next call, first two minutes"
          />
        </label>
      </div>
      <label>
        What feels difficult or important?
        <textarea
          required
          minLength={3}
          maxLength={500}
          value={value.difficulty}
          onChange={(event) => onChange({ ...value, difficulty: event.target.value })}
          placeholder="Example: I want to start clearly instead of rushing through the first sentence."
        />
      </label>
      <button disabled={loading} type="submit">
        {loading ? "Generating mission..." : "Generate one mission"}
      </button>
    </form>
  );
}

function MissionView({ mission }: { mission: Mission }) {
  return (
    <article className="result">
      <p className="eyebrow">Your speaking mission</p>
      <h2>{mission.title}</h2>
      <p>{mission.framing}</p>
      <dl>
        <div>
          <dt>Mission</dt>
          <dd>{mission.mission}</dd>
        </div>
        <div>
          <dt>What this mission is testing</dt>
          <dd>{mission.focus}</dd>
        </div>
        <div>
          <dt>Evidence to notice</dt>
          <dd>{mission.successSignal}</dd>
        </div>
      </dl>
    </article>
  );
}

function ReportFormView({
  value,
  loading,
  responseNumber,
  onChange,
  onSubmit
}: {
  value: string;
  loading: boolean;
  responseNumber: number;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const firstReport = responseNumber === 1;

  return (
    <form className="flow report" onSubmit={onSubmit}>
      <p className="response-count">Response {responseNumber + missionThreadLimits.missionResponseCount} of {missionThreadLimits.maxTotalResponses}</p>
      <label>
        {firstReport ? "What actually happened?" : "Add clarification, disagreement, or another observation"}
        <textarea
          required
          minLength={3}
          maxLength={900}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={
            firstReport
              ? "Report what you tried, what the other person did, and anything concrete you noticed."
              : "Add a missing fact, correction, disagreement, relevant question, or another observation from this same speaking moment."
          }
        />
      </label>
      <button disabled={loading} type="submit">
        {loading ? "Reading your update..." : firstReport ? "Get evidence and next step" : "Send continuation"}
      </button>
    </form>
  );
}

function ThreadView({ exchanges }: { exchanges: CoachExchange[] }) {
  if (exchanges.length === 0) {
    return null;
  }

  return (
    <div className="thread" aria-label="Mission thread">
      {exchanges.map((exchange, index) => (
        <article className="result reflection" key={exchange.id}>
          <p className="eyebrow">Coach response {index + 2} of {missionThreadLimits.maxTotalResponses}</p>
          <h2>Evidence from this moment</h2>
          <blockquote>{exchange.userText}</blockquote>
          <ul>
            {exchange.coachResponse.observedEvidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <dl>
            <div>
              <dt>Useful interpretation</dt>
              <dd>{exchange.coachResponse.usefulInterpretation}</dd>
            </div>
            <div>
              <dt>One next step</dt>
              <dd>{exchange.coachResponse.nextStep}</dd>
            </div>
          </dl>
          <p>{exchange.coachResponse.closing}</p>
        </article>
      ))}
    </div>
  );
}

function ThreadActions({
  responseCount,
  canContinue,
  finalResponse,
  onContinue,
  onStartAgain
}: {
  responseCount: number;
  canContinue: boolean;
  finalResponse: boolean;
  onContinue: () => void;
  onStartAgain: () => void;
}) {
  return (
    <div className="thread-actions">
      <p className="response-count">
        Response {responseCount + missionThreadLimits.missionResponseCount} of {missionThreadLimits.maxTotalResponses}
      </p>
      {finalResponse ? <p className="empty">This bounded mission thread is complete.</p> : null}
      {canContinue ? <button type="button" onClick={onContinue}>Continue this mission</button> : null}
      <button className="secondary" type="button" onClick={onStartAgain}>Start a new mission</button>
    </div>
  );
}

function HistoryPanel({ history, onClear }: { history: HistoryEntry[]; onClear: () => void }) {
  return (
    <aside className="history">
      <div className="history-head">
        <div>
          <p className="eyebrow">Local history</p>
          <h2>Mission history</h2>
        </div>
        <button disabled={history.length === 0} type="button" onClick={onClear}>Clear</button>
      </div>
      {history.length === 0 ? (
        <p className="empty">Completed Moment Coach loops will appear here on this browser only.</p>
      ) : (
        <ul>
          {history.map((entry) => (
            <li key={entry.id}>
              <time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString()}</time>
              <strong>{entry.situationSummary}</strong>
              <span>{entry.mission.title}</span>
              <span>{entry.responseCount + missionThreadLimits.missionResponseCount} of {missionThreadLimits.maxTotalResponses} total coach responses used</span>
              {entry.thread.at(-1) ? <span>Next: {entry.thread.at(-1)?.coachResponse.nextStep}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
