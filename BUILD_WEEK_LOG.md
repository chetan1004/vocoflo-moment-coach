# Build Week Log

All times are recorded in India Standard Time unless otherwise stated.

## 2026-07-19T21:13:17+05:30 - Repository baseline

- Devpost registration verified.
- Official deadline verified as July 22, 2026 at 5:30 AM IST.
- Internal freeze remains July 21, 2026 at 9:00 PM IST.
- Codex CLI 0.144.6 installed.
- Codex authenticated using ChatGPT.
- ChatGPT Codex allowance showed 100% weekly usage remaining before implementation.
- Git, Node.js, npm, GitHub CLI, and GitHub authentication verified.
- Independent workspace created at:
  `C:\Users\Black Pearl\VocoFloBuildWeek2026`
- No main VocoFlo repository, file, database, project knowledge, or documentation was copied or modified.
- No Build Week application code existed at this baseline.
- No OpenAI API key was created or handled.
- Existing API credit balance was observed but not authorized for use.

## 2026-07-19T21:48:27+05:30 - Primary Codex implementation checkpoint

- Primary implementation thread read `AGENTS.md`, `README.md`, `BUILD_WEEK_LOG.md`, `docs/ARCHITECTURE_DECISIONS.md`, `evidence/README.md`, and `evidence/codex/PRIMARY_THREAD_BOOTSTRAP_PROMPT.md` before code edits.
- Selected Next.js App Router, TypeScript, npm, official OpenAI JavaScript SDK, server route handlers, Zod validation, native CSS, browser localStorage, Vitest, and Testing Library.
- Implemented the fixed Moment Coach beta loop: situation form, GPT-5.6 mission route, report-back route, evidence extraction, one next step, and local browser history.
- Added `.env.example` placeholders only. No `.env`, `.env.local`, API key, or secret was created or handled.
- Added mocked route and UI tests only at that checkpoint.
- `npm install` required approved package network access because the Windows sandbox cache did not contain dependencies.
- `npm test` and `npm run build` required approved Windows process-spawn access after sandbox `EPERM` failures.
- Local validation passed: `npm run lint`, `npm test`, and `npm run build`.
- Local dev server was started on `127.0.0.1:3000` and returned HTTP 200 without invoking any OpenAI route.

## 2026-07-20T14:52:49+05:30 - Directional-coach quality enhancement

- Continued the primary Codex implementation session in the same independent Build Week repository.
- Added prominent audience positioning: "Real-world speaking coaching for people who stutter."
- Revised hero loop copy to emphasize one bounded evidence mission, prediction versus actual outcome, report-back, and one next step.
- Added a restrained "How this coach works" section without making the larger-method "watcher" concept a primary visible label.
- Refined mission and report-back prompts through pure prompt builders while keeping existing schemas and default `gpt-5.6` model behavior.
- Updated mission UI labels from "Focus" and "Success signal" to "What this mission is testing" and "Evidence to notice."
- Added tests for the audience copy, method explanation, mission labels, and prompt guardrails.
- Documented that the underlying VocoFlo direction and later "watcher" concept pre-date Build Week, while this web implementation, prompt adaptation, audience statement, UI explanation, tests, and evidence are Build Week work.
- No historical prompt, main-project implementation, or main VocoFlo file was inspected or copied.
- During that checkpoint, OpenAI was not called and no key value was exposed.

## 2026-07-20T15:20:16+05:30 - Report-context continuity correction

- Extended the existing report request contract to carry the original `SituationRequest` alongside the existing mission and report.
- Updated the client report submission, report API route, and report prompt builder so prediction-versus-reality analysis receives the original situation, audience, stated difficulty or fear, timing, mission focus, mission framing, evidence target, and actual report.
- Added a prompt rule that treats the original difficulty as the user's earlier fear, prediction, or concern, not as a fact about what happened.
- Updated tests for client request body continuity, report route forwarding, and report prompt context.
- This was evidence-alignment continuity for the existing loop, not a feature expansion.
- During that checkpoint, OpenAI was not called and no key value was exposed.

## 2026-07-20T16:11:26+05:30 - Model-output validation classification fix

- A controlled live test before this fix produced a successful mission call.
- The first live report call completed at the API level but returned a recoverable HTTP 400 form-validation message because model-output validation was conflated with incoming request validation.
- The pre-repair live sequence included one mission call and one report call before this checkpoint.
- Fixed the bug without making another live OpenAI API call.
- Synchronized mission and reflection Structured Output JSON schema string/count limits with the Zod response schemas.
- Added concise prompt brevity rules so model fields stay inside structured-output limits.
- Added `ModelOutputError` classification so invalid model output returns the coaching-service invalid-response message instead of a form error.
- At that moment, live report re-verification was still outstanding; it was later completed GREEN after retry.

## 2026-07-20T16:45:40+05:30 - Complete live loop verified

- Complete live Moment Coach loop is GREEN after the model-output validation repair.
- Original live mission call succeeded.
- First live report call did not succeed; it returned a recoverable form error because model-output validation was incorrectly classified as user-input validation.
- Structured Outputs and runtime schemas were synchronized, and model-output errors were separated from request-validation errors.
- The existing report was retried once after independent validation, and the retry completed successfully.
- The completed loop appeared in local browser history.
- OpenAI project dashboard showed five measured requests, US$0.07 total spend, and 2,450 displayed tokens.
- Project spend setting was US$1.00 with 20% / US$0.20 and 100% / US$1.00 alerts.
- Five measured requests is recorded as authoritative; the earlier manual ledger counted three user-triggered submissions, and no speculation is recorded about the difference.
- No further local API calls are planned before deployment.

## 2026-07-20 - Initial production deployment and public smoke

- Initial Vercel production deployment completed for project `vocoflo-moment-coach`.
- Production URL: https://vocoflo-moment-coach.vercel.app
- Source commit: `96f7672`.
- Deployment status: Ready.
- Public smoke evidence recorded usage moving from 5 to 7 requests.
- Public smoke evidence recorded spend moving from US$0.07 to US$0.08.
- Exactly two intentional public requests were made during public smoke testing.
- This public deployment was the earlier verified build before the bounded-continuity amendment.

## 2026-07-20T19:16:04+05:30 - Bounded continuity amendment

- Founder ruling approved a bounded continuity amendment after public smoke testing showed one report could end the coaching moment too abruptly.
- The original Build Week beta used one mission and one report.
- One active mission now supports one mission-generation response plus up to three report or continuation coach responses.
- Continuation can carry clarification, disagreement, missing evidence, another relevant observation, or a relevant question while staying grounded in the same active mission.
- This remains bounded and is not open-ended chat.
- The feature is a UI- and request-bounded mission thread; no account or database-backed global request enforcement was added.
- Local history now stores the complete mission thread as one record and remains compatible with older one-report records.
- Updated tests for response caps, continuation controls, start-new behavior, single-record thread storage, older-history compatibility, continuation prompt context, unrelated-content constraint, and rendered text without user-facing "experiment" wording.
- Homepage now carries one unified direction section, moves Mission history below it, declares the bounded mission limit, adds GPT-5.6/Codex attribution, and distinguishes GPT-5.6's adaptive reasoning and language from VocoFlo's bounded coaching method, evidence rules, response limits, and direction.
- Added a simple temporary V favicon for browser-tab and demo polish.
- No live OpenAI API call occurred during this amendment checkpoint.
- No deployment occurred.
- The amended build still requires final redeployment and public smoke testing.
