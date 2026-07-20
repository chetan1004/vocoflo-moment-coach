# Primary Codex Thread Bootstrap Prompt

You are the primary implementation agent for VocoFlo Moment Coach, an OpenAI Build Week 2026 submission.

This must remain the principal Codex thread for the majority of the application's core implementation.

## First action

Read these repository files completely before changing anything:

- AGENTS.md
- README.md
- BUILD_WEEK_LOG.md
- docs/ARCHITECTURE_DECISIONS.md
- evidence/README.md

Then inspect only this repository.

Never inspect, search, import, read, edit, or reference another VocoFlo directory, repository, project, database, or documentation source.

## Operating mode

Work autonomously on routine and reversible repository decisions.

Do not pause to ask about ordinary framework, package, naming, styling, validation, testing, or file-structure choices.

Stop only if the task would require:

- an API key or other secret;
- an actual paid OpenAI API request;
- deployment or creation of an external resource;
- a GitHub repository or remote;
- a destructive action;
- access outside this repository;
- a strategic change to the fixed product scope.

Do not create a Git commit.

## Required architecture

Select and document the smallest reliable deployment architecture.

Preferred architecture unless you find a concrete blocker:

- Next.js App Router
- TypeScript
- npm
- official OpenAI JavaScript SDK
- server-side route handlers
- browser localStorage for completed-history records
- native CSS or another minimal styling approach
- Vitest and Testing Library for automated tests

Do not add a database, authentication system, payment system, analytics service, component library, or unnecessary infrastructure.

Record the final architecture and reasons in:

- docs/ARCHITECTURE_DECISIONS.md

## Fixed working product loop

Implement one complete Moment Coach loop:

1. User describes an upcoming speaking situation.
2. Server calls GPT-5.6 and returns one bounded speaking mission.
3. User completes the moment and reports what happened.
4. Server calls GPT-5.6 again and extracts concrete evidence.
5. Server returns one bounded next step.
6. Browser saves the completed loop in simple local history.

The experience must use an explicit state machine or equally clear typed state structure.

## Mission-stage behavior

Collect enough context without turning the interface into an interrogation.

Suggested fields:

- upcoming speaking situation;
- who the user will speak with;
- what feels difficult or important;
- optional timing or context.

Generate exactly one mission, not a list of techniques.

The mission response must include a compact structured result such as:

- title;
- mission;
- focus;
- success signal;
- short supportive framing.

Keep the mission specific, realistic, and possible during the upcoming situation.

Do not promise fluent speech or symptom removal.

## Report-back behavior

Collect the user's real report after the moment.

Generate a structured result containing:

- observed evidence;
- useful interpretation;
- one next step;
- short supportive closing.

Extract evidence from what the user actually reported.

Do not invent progress, success, feelings, or events that were not supplied.

Give exactly one next step.

## Safety and claims

This is educational speaking coaching, not medical treatment or therapy.

Do not diagnose stammering or any condition.

Do not claim to treat, cure, eliminate, or medically assess anything.

Include a concise product disclaimer without making the interface alarming or clinical.

## API implementation

Use the official OpenAI JavaScript SDK and the Responses API.

Use:

- environment variable OPENAI_API_KEY;
- environment variable OPENAI_MODEL;
- default model gpt-5.6.

Keep the API key entirely server-side.

Create .env.example with placeholders only.

Never create .env, .env.local, or any real secret.

Use structured outputs or a robust validated JSON response mechanism.

Validate all incoming and outgoing data.

Return safe, useful errors to the client without exposing stack traces, prompts, environment values, or provider internals.

Use two model calls per complete loop, one for mission and one for report-back.

Keep prompts and outputs bounded so normal demo calls remain inexpensive.

Do not make any real OpenAI API call during this checkpoint.

Tests must mock the OpenAI client.

## User interface

Build a polished but restrained responsive interface suitable for desktop and mobile browsers.

Required screens or states:

- opening situation form;
- loading state;
- generated mission;
- report-back form;
- evidence and next-step result;
- local history;
- empty-history state;
- clear-history control with confirmation;
- recoverable API and validation errors.

Clearly display:

### Works in this Build Week beta

- text-based upcoming-moment coaching;
- one AI-generated mission;
- report-back evidence;
- one next step;
- local browser history.

### Planned for the larger VocoFlo product

- speech recording and speech-event analysis;
- longer guided learning paths;
- deeper progress patterns and personalization.

Never represent planned features as implemented.

## Local history

Save only completed loops to browser localStorage.

History entries should contain:

- stable local ID;
- creation timestamp;
- situation summary;
- generated mission;
- report-back;
- extracted evidence;
- next step.

Handle malformed or unavailable localStorage safely.

Do not save API keys, provider responses, hidden prompts, or diagnostic internals.

## Testing requirements

Create meaningful automated tests covering at least:

- request validation;
- response-schema validation;
- state progression;
- local-history serialization and malformed-data recovery;
- mission route with mocked OpenAI response;
- report-back route with mocked OpenAI response;
- one representative UI interaction flow;
- safe error handling.

Required scripts:

-
pm run lint
-
pm test
-
pm run build

All three must pass before reporting completion.

## Documentation and evidence

Update:

- README.md
- BUILD_WEEK_LOG.md
- docs/ARCHITECTURE_DECISIONS.md

README must include:

- local setup;
- environment variables;
- test commands;
- fixed beta scope;
- working versus planned features;
- architecture summary;
- pre-existing versus Build Week disclosure;
- explicit statement that no historical VocoFlo implementation was copied;
- deployment section marked pending;
- demo section marked pending.

Create:

- evidence/codex/PRIMARY_THREAD_IMPLEMENTATION_SUMMARY.md
- evidence/tests/LOCAL_VERIFICATION.md

Record:

- architecture selected;
- files created;
- commands run;
- test results;
- build result;
- known limitations;
- confirmation that no live API request occurred;
- confirmation that no secret was created or handled.

## Completion report

At the end:

1. Run git diff --check.
2. Run git status --short.
3. Run git diff --stat.
4. Run all required validation commands.
5. Do not commit.
6. Report:
   - architecture;
   - functionality implemented;
   - tests and build results;
   - unresolved risks;
   - whether any request accessed the network;
   - whether any live OpenAI API request occurred;
   - exact files changed or created.
