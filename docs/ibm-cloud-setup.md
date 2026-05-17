# IBM Cloud Setup for CodeQuest Bob

This guide keeps the IBM ecosystem setup safe, reviewable, and portfolio-ready.

## What Somi already has

The hackathon IBM Cloud account is active and includes these resources:

- `watsonx-Hackathon WS` - watsonx.ai Studio, Dallas `us-south`
- `watsonx-Hackathon WML` - Watson Machine Learning, Dallas `us-south`
- `watsonx-Hackathon NLU` - Natural Language Understanding, Dallas `us-south`
- `watsonx-Hackathon TTS` - Text to Speech, Dallas `us-south`
- `watsonx-Hackathon STT` - Speech to Text, Dallas `us-south`
- `watsonx-Hackathon Orchestrate` - watsonx Orchestrate, London `eu-gb`
- `watsonx-Hackathon GOV` - watsonx.governance, Dallas `us-south`

The hackathon account is temporary, so treat all integrations as demo/hackathon resources.

## Security rules

- Never commit API keys, IAM tokens, `.env.local`, service credentials, or credential JSON files.
- Do not put IBM API keys in frontend code.
- Do not use `VITE_` for secret values because Vite exposes those variables to the browser bundle.
- Use `.env.example` as the public template and `.env.local` as the private local file.
- If a key is accidentally committed, rotate it immediately in IBM Cloud.

## Values needed

Create `.env.local` from `.env.example` and fill only the services used in the demo.

```bash
cp .env.example .env.local
```

### 1. IBM Cloud API key

Use this for watsonx.ai IAM bearer token generation.

Console path:

1. IBM Cloud console
2. Manage
3. Access IAM
4. API keys or Service IDs
5. Create/copy API key

Environment variable:

```bash
IBM_CLOUD_API_KEY=
```

### 2. watsonx.ai / Watson Machine Learning

Required values:

```bash
WATSONX_PROJECT_ID=
WATSONX_URL=https://us-south.ml.cloud.ibm.com
WATSONX_MODEL_ID=ibm/granite-13b-instruct-v2
```

Where to find:

- Open watsonx.ai Studio.
- Open or create a project.
- Find the project ID from the project settings/details.
- For Dallas resources, use `https://us-south.ml.cloud.ibm.com`.

Use in CodeQuest Bob:

- Generate Skill Boost text.
- Generate Incident Responder hints.
- Draft a postmortem summary.

### 3. Natural Language Understanding

Required values:

```bash
NLU_API_KEY=
NLU_URL=
NLU_VERSION=2022-04-07
```

Where to find:

1. IBM Cloud resource list
2. `watsonx-Hackathon NLU`
3. Manage or Service credentials
4. Copy API key and URL

Use in CodeQuest Bob:

- Analyze README/docs text.
- Extract repository topics, keywords, and concepts.
- Support documentation quality scoring.

### 4. Text to Speech

Required values:

```bash
TTS_API_KEY=
TTS_URL=
TTS_VOICE=en-US_AllisonV3Voice
```

Where to find:

1. IBM Cloud resource list
2. `watsonx-Hackathon TTS`
3. Manage or Service credentials
4. Copy API key and URL

Use in CodeQuest Bob:

- Generate quest briefing narration.
- Add accessibility and multimodal demo value.

### 5. Speech to Text

Required values:

```bash
STT_API_KEY=
STT_URL=
STT_MODEL=en-US_BroadbandModel
```

Where to find:

1. IBM Cloud resource list
2. `watsonx-Hackathon STT`
3. Manage or Service credentials
4. Copy API key and URL

Use in CodeQuest Bob:

- Optional voice input for "What should I do next?"
- Good portfolio story, but lower priority than Bob, watsonx.ai, NLU, and TTS.

### 6. watsonx Orchestrate

Use in CodeQuest Bob:

- Optional follow-up workflow story.
- Example: after a learner completes the Developer Growth Passport, Orchestrate could trigger a maintainer handoff or next-growth-plan workflow.

This is a stretch integration for the hackathon demo. Do not block the MVP on it.

### 7. watsonx.governance

Use in CodeQuest Bob:

- Responsible AI story.
- Trace which AI-generated recommendations were reviewed by a human.
- Show that incident hints and contribution suggestions are assistance, not automatic truth.

This can be documented as an architecture/governance layer if time is short.

## Recommended integration priority

1. IBM Bob: mandatory and central. Export session reports into `bob_sessions/`.
2. watsonx.ai / Granite: live or semi-live generation for Skill Boosts and incident hints.
3. NLU: live documentation/topic extraction from README text.
4. TTS: quest briefing narration.
5. STT: optional voice input.
6. Orchestrate: architecture/story layer unless there is extra time.
7. Governance: architecture/story layer unless there is extra time.

## Quick local smoke tests

Replace placeholders with local `.env.local` values before running.

### IAM token for watsonx.ai

```bash
curl -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  "https://iam.cloud.ibm.com/identity/token" \
  -d "grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${IBM_CLOUD_API_KEY}"
```

### NLU text analysis

```bash
curl -X POST -u "apikey:${NLU_API_KEY}" \
  --header "Content-Type: application/json" \
  --data '{
    "text": "CodeQuest Bob turns repositories into gamified developer growth journeys.",
    "features": {
      "keywords": {},
      "concepts": {},
      "categories": {}
    }
  }' \
  "${NLU_URL}/v1/analyze?version=${NLU_VERSION}"
```

### TTS synthesis

```bash
curl -X POST -u "apikey:${TTS_API_KEY}" \
  --header "Content-Type: application/json" \
  --header "Accept: audio/wav" \
  --data '{"text":"Welcome to CodeQuest Bob. Your first quest is Repo Explorer."}' \
  --output quest-briefing.wav \
  "${TTS_URL}/v1/synthesize?voice=${TTS_VOICE}"
```

## MVP implementation note

Because this is currently a Vite frontend app, real IBM API calls should be added through a small backend or serverless proxy. For the first hackathon demo, the frontend can show IBM ecosystem evidence using safe mock data while the README and `bob_sessions/` prove Bob usage.
