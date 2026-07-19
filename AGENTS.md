# AGENTS.md

## Controlling mission

Build and ship VocoFlo Moment Coach as a standalone responsive web beta for OpenAI Build Week 2026.

## Repository boundary

- Work only inside this repository.
- Never inspect, edit, move, delete, import, or reference files from another VocoFlo repository or project directory.
- Do not use a Git worktree.
- Do not copy historical VocoFlo files.
- Do not access unrelated folders.
- Do not create or expose secrets.
- Never commit `.env` files or API keys.

## Fixed product loop

Implement exactly one complete loop:

1. Describe an upcoming speaking situation.
2. Generate one GPT-5.6 speaking mission.
3. Accept the user’s report-back.
4. Extract concrete evidence from that report.
5. Give one bounded next step.
6. Save simple local browser history.

## Product boundaries

- Responsive web beta only.
- No mobile application.
- No speech recording or stammer-detection model.
- No account system.
- No payment or subscription.
- No complex database.
- No six-week course.
- No multilingual system unless explicitly authorized.
- No medical, diagnostic, treatment, therapy, or cure claims.
- Clearly label working beta features versus planned features.
- Do not claim planned VocoFlo capabilities already exist.

## Build Week requirements

- Codex is the primary implementation agent.
- Keep the majority of core functionality inside one primary Codex thread.
- GPT-5.6 must perform meaningful product behavior through the OpenAI API.
- Preserve tests, evidence, screenshots, deployment records, and timestamped commits.
- Update `BUILD_WEEK_LOG.md` after meaningful milestones.
- Maintain honest provenance in the README.
- Prefer a reliable deployable loop over visual extras.

## Approval boundaries

Stop and ask before:

- Spending money or changing billing
- Creating, revealing, rotating, or handling secrets
- Creating or changing external accounts or public resources
- Public deployment or submission
- Destructive actions
- Strategic scope changes

Routine reversible repository work may proceed without repeated permission.
