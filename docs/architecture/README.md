# CodeQuest Bob Architecture Diagram

This folder contains slide-ready architecture assets for the IBM Bob Hackathon submission.

## Files

- `codequest-bob-architecture-clean.svg` - portfolio-ready architecture graphic with embedded IBM/Watson icons.
- `../screenshots/codequest-bob-architecture-clean.png` - Medium/README-friendly rendered PNG.
- `codequest-bob-architecture.svg` - editable source variant.
- `codequest-bob-architecture.mmd` - Lightweight Mermaid reference for the underlying system flow.

## Diagram Story

The diagram is designed to communicate four things quickly:

1. The user-facing product flow is simple: Home, Repo Intake, 3D Quest Map, Quest Detail, Passport.
2. IBM credentials are kept server-side through the API proxy.
3. IBM services are used inside actual product features:
   - IBM Bob IDE: repo-aware development and exported session reports.
   - watsonx.ai / IBM Granite: learning recommendation reasoning.
   - Watson NLU: keyword and learning signal extraction.
   - Watson Text to Speech and Speech to Text: quest audio briefing loop.
   - IBM Cloudant: saved Skill Boost persistence.
4. Growth evidence is explicit: `bob_sessions`, First PR package, Quest Badges, Passport timeline.

## Recommended Slide Caption

CodeQuest Bob converts repository context into a guided developer growth journey. IBM Bob drives repo-aware development and exported session history, while IBM Cloud services power learning recommendations, speech briefings, and saved growth records through a server-side API proxy.
