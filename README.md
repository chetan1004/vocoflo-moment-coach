# VocoFlo Moment Coach

Standalone responsive web beta for OpenAI Build Week 2026.

Audience positioning added during Build Week: real-world speaking coaching for people who stutter.

## Fixed Beta Scope

This repository implements exactly one complete Moment Coach loop:

1. The user describes an upcoming speaking situation.
2. A server-side OpenAI Responses API call generates one GPT-5.6 bounded evidence mission.
3. The user reports what happened after the moment.
4. A second server-side OpenAI Responses API call extracts concrete evidence from the report.
5. The app returns one bounded next step.
6. The browser saves the completed loop in localStorage history.

This is educational speaking coaching only. It does not diagnose, treat, cure, record speech, or medically assess any condition.

## Works in this Build Week beta

- Text-based upcoming-moment coaching
- One AI-generated real-world evidence mission
- Report-back evidence extraction
- One next step
- Simple local browser history
- Recoverable validation and API error states
- Visible explanation of the one-experiment report-back method

## Planned for the larger VocoFlo product

- Speech recording and speech-event analysis
- Longer guided learning paths
- Deeper progress patterns and personalization

Those planned capabilities are not implemented in this beta.

## Coaching Method

VocoFlo supplies GPT-5.6 with a defined coaching method. The coach identifies one relevant speaking habit, such as checking, restarting, avoiding, or controlling, selects one evidence lens, and turns it into one bounded real-world experiment.

This beta contains a compact authored coaching method for the Moment Coach loop, not the complete VocoFlo learning program.

## Architecture Summary

- Next.js App Router
- TypeScript
- npm
- Official OpenAI JavaScript SDK
- Server-side route handlers for `/api/mission` and `/api/report`
- Zod validation for requests and model outputs
- Browser localStorage for completed-history records
- Native CSS
- Vitest and Testing Library

The OpenAI API key stays server-side. The browser never stores API keys, prompts, provider internals, or raw diagnostic data.

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file only when running live coaching locally:

```bash
cp .env.example .env.local
```

Then set:

```bash
OPENAI_API_KEY=your-server-side-key
OPENAI_MODEL=gpt-5.6
```

Do not commit `.env.local` or any real secret.

Run the development server:

```bash
npm run dev
```

## Test Commands

```bash
npm run lint
npm test
npm run build
```

Current local verification is recorded in `evidence/tests/LOCAL_VERIFICATION.md`.

## Build Week Provenance

This repository is an independent OpenAI Build Week 2026 contest repository created on July 19, 2026. No historical VocoFlo implementation files were copied into this repository, and this implementation did not inspect or import another VocoFlo repository.

Pre-existing VocoFlo work that must be disclosed in final submission:

- The VocoFlo name and broader product vision
- Product research about speaking and stammering
- Historical coaching concepts and product philosophy
- Earlier prompts and coaching experiments
- The underlying VocoFlo direction and later larger-method "watcher" concept
- Existing mobile, backend, detection-model, and documentation work outside this repository

Build Week work in this repository includes the responsive web beta, API route implementation, prompt adaptation for this bounded loop, audience statement, visible method explanation, validation, tests, documentation, and local evidence files. No historical prompt or main-project implementation was copied.

## Deployment

Pending. No external deployment or public resource has been created yet.

## Demo

Local live loop: verified GREEN after repair. The first live mission call succeeded, the first live report call failed locally after model-output validation, and the repaired report retry succeeded. The completed loop saved in browser-local history.

Public smoke test: pending until deployment.
