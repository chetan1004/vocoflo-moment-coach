"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { buildHistoryEntry, clearHistory, readHistory, saveCompletedLoop, type HistoryEntry } from "@/lib/history";
import { initialCoachStep, missionReady, reflectionReady, type CoachStep } from "@/lib/coach-state";
import type { Mission, Reflection, SituationRequest } from "@/lib/schemas";

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

  const canReport = step.kind === "mission" || step.kind === "loadingReflection";
  const completed = step.kind === "reflection";

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
    if (step.kind !== "mission") {
      return;
    }

    setError("");
    const loadingState: Extract<CoachStep, { kind: "loadingReflection" }> = {
      kind: "loadingReflection",
      situation: step.situation,
      mission: step.mission,
      report
    };
    setStep(loadingState);

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation: step.situation, mission: step.mission, report })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to review your report.");
      }

      const nextState = reflectionReady(loadingState, payload.reflection as Reflection);
      setStep(nextState);
      const entry = buildHistoryEntry({
        situation: nextState.situation,
        mission: nextState.mission,
        report: nextState.report,
        reflection: nextState.reflection
      });
      saveCompletedLoop(entry);
      setHistory(readHistory());
    } catch (reportError) {
      setStep(step);
      setError(reportError instanceof Error ? reportError.message : "Unable to review your report.");
    }
  }

  function startAgain() {
    setStep(initialCoachStep);
    setSituation(emptySituation);
    setReport("");
    setError("");
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
          <h1>VocoFlo Moment Coach</h1>
          <p className="audience">Real-world speaking coaching for people who stutter.</p>
          <p className="lede">
            Plan one upcoming speaking moment, try one bounded evidence mission, then report back to compare what fear
            predicted with what actually happened and take one next step.
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

          {(step.kind === "mission" || step.kind === "loadingReflection" || step.kind === "reflection") && (
            <MissionView mission={step.mission} />
          )}

          {canReport && (
            <ReportFormView
              value={report}
              loading={step.kind === "loadingReflection"}
              onChange={setReport}
              onSubmit={handleReportSubmit}
            />
          )}

          {completed && (
            <ReflectionView reflection={step.reflection} report={step.report} onStartAgain={startAgain} />
          )}
        </div>

        <HistoryPanel history={history} onClear={handleClearHistory} />
      </section>

      <section className="method" aria-labelledby="method-title">
        <h2 id="method-title">How this coach works</h2>
        <p>
          Moment Coach does not score your speech or give you a pile of techniques. It gives one real-world experiment,
          then uses your report to compare what fear predicted with what actually happened. Over time, these moments can
          help you notice the urge to check or control speech and become less governed by it.
        </p>
      </section>
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
  onChange,
  onSubmit
}: {
  value: string;
  loading: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="flow report" onSubmit={onSubmit}>
      <label>
        What actually happened?
        <textarea
          required
          minLength={3}
          maxLength={900}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Report what you tried, what the other person did, and anything concrete you noticed."
        />
      </label>
      <button disabled={loading} type="submit">
        {loading ? "Reading your report..." : "Get evidence and next step"}
      </button>
    </form>
  );
}

function ReflectionView({
  reflection,
  report,
  onStartAgain
}: {
  reflection: Reflection;
  report: string;
  onStartAgain: () => void;
}) {
  return (
    <article className="result reflection">
      <p className="eyebrow">Report-back result</p>
      <h2>Evidence from this moment</h2>
      <blockquote>{report}</blockquote>
      <ul>
        {reflection.observedEvidence.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <dl>
        <div>
          <dt>Useful interpretation</dt>
          <dd>{reflection.usefulInterpretation}</dd>
        </div>
        <div>
          <dt>One next step</dt>
          <dd>{reflection.nextStep}</dd>
        </div>
      </dl>
      <p>{reflection.closing}</p>
      <button type="button" onClick={onStartAgain}>Start another moment</button>
    </article>
  );
}

function HistoryPanel({ history, onClear }: { history: HistoryEntry[]; onClear: () => void }) {
  return (
    <aside className="history">
      <div className="history-head">
        <div>
          <p className="eyebrow">Local history</p>
          <h2>Completed loops</h2>
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
              <span>Next: {entry.reflection.nextStep}</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
