# Architecture Decisions

## Selected Architecture

VocoFlo Moment Coach uses the smallest reliable deployment architecture from the bootstrap prompt:

- Next.js App Router
- TypeScript
- npm
- Official OpenAI JavaScript SDK
- Server-side route handlers
- Browser localStorage for completed-history records
- Native CSS
- Vitest and Testing Library

## Reasons

- Next.js App Router provides one deployable responsive web app with server-side API routes, keeping the OpenAI API key out of the browser.
- TypeScript and Zod make the fixed product loop explicit and validate requests, model outputs, state progression, and local history shape.
- The official OpenAI JavaScript SDK keeps the provider integration conventional and focused on the Responses API.
- localStorage is enough for the required simple browser history and avoids database, account, and hosting complexity.
- Native CSS avoids unnecessary component-library and styling dependencies.
- Vitest and Testing Library cover contracts and one representative UI loop without making a live OpenAI call.
- Prompt builders are kept as small pure functions so the directional coaching guardrails can be tested without calling the OpenAI API.

## Product Loop Mapping

1. Situation form collects the upcoming speaking moment, audience, difficulty, and optional timing.
2. `/api/mission` validates the request and calls GPT-5.6 through the Responses API to return one structured evidence mission.
3. The report-back form collects what actually happened.
4. `/api/report` validates the mission and report, then calls GPT-5.6 again to extract evidence and one next step.
5. The client displays the evidence, interpretation, next step, and closing.
6. Completed loops are saved in localStorage using a validated history record.

## Boundaries

- No mobile application
- No speech recording
- No stammer-detection model
- No account system
- No payments
- No database
- No analytics service
- No medical, diagnostic, treatment, therapy, cure, or fluency-removal claims

## API Notes

- `OPENAI_API_KEY` is required only on the server.
- `OPENAI_MODEL` defaults to `gpt-5.6`.
- The app uses two model calls per completed loop: mission generation and report-back reflection.
- Model responses are requested as JSON schema output and then validated again with Zod.
- Errors returned to the client are intentionally generic and do not expose stack traces, prompts, environment values, or provider internals.
- Mission prompts require exactly one realistic real-world evidence experiment, one primary evidence lens, no technique stacking, no invented progress, and no fluency or symptom-removal promise.
- Report-back prompts require direct observations before interpretation, no invented evidence, supported prediction-versus-reality comparison only, and exactly one next real-world experiment.

## Provenance Note

The underlying VocoFlo direction and later larger-method "watcher" concept pre-date Build Week. This Build Week repository did not copy historical prompts, main-project implementation files, or other VocoFlo project materials. The web implementation, prompt adaptation for the bounded Moment Coach loop, audience statement, visible method explanation, tests, and evidence are Build Week work in this repository.

## Checkpoint Status

Local live mission-and-report loop is verified GREEN after repair. The first live mission call succeeded, the first live report call failed locally after model-output validation was classified as request validation, and the repaired report retry succeeded. Deployment and public smoke testing remain pending.
