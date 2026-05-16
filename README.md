# CodeQuest Bob

> Level up inside real codebases.

CodeQuest Bob is a gamified developer growth platform for the IBM Bob Hackathon. It uses IBM Bob to turn real repository context into growth quests that help developers progress from `Repo Explorer` to `First Contributor` to `Incident Responder`, ending with a `Developer Growth Passport`.

## Positioning

```text
Others explain code. CodeQuest Bob grows developers.
```

CodeQuest Bob is not another repo explainer, PR assistant, or static onboarding guide. It is a contribution and operations readiness journey built around real codebase context.

## Core Flow

```text
Repo Scan
  -> Growth Quest Map
  -> Repo Explorer Quest
  -> First Contributor Quest
  -> Incident Responder Quest
  -> Skill Boosts
  -> Developer Growth Passport
```

## IBM Ecosystem

| IBM Service | Role in CodeQuest Bob |
| --- | --- |
| IBM Bob IDE | Repository analysis, growth quest generation, incident drill creation, exported session reports |
| watsonx.ai Studio | Prompt experimentation for Skill Boosts |
| Watson Machine Learning / IBM Granite | Just-in-time learning, incident hints, postmortem draft generation |
| Natural Language Understanding | README/docs topic extraction and complexity hints |
| Text to Speech | Accessible quest and incident briefing narration |
| Speech to Text | Optional voice input for "what should I do next?" |
| watsonx Orchestrate | Optional follow-up growth workflow extension |
| watsonx.governance | Traceability, responsible AI, and security story |

## Hackathon Evidence

The IBM Bob Hackathon requires exported Bob task session reports. Store them here:

```text
bob_sessions/
```

Suggested reports:

```text
bob_sessions/
  session-01-repo-analysis.md
  session-01-consumption-summary.png
  session-02-growth-quest-generation.md
  session-02-consumption-summary.png
  session-03-implementation-review.md
  session-03-consumption-summary.png
```

## Security

Never commit:

- `.env` files
- IBM Cloud API keys
- IAM tokens
- Bob credentials
- downloaded credential files
- secrets copied inside exported Bob sessions

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
