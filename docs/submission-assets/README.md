# CodeQuest Bob Submission Assets

This directory contains generated material for the IBM Bob Hackathon submission:

- `screenshots/` - automated app screenshots for the demo video and slide deck
- `codequest-bob-pitch-deck.pptx` - generated pitch deck
- `demo-video-script.md` - short recording script for a 5-minute video

## Generate Screenshots

Start the app first:

```bash
npm run dev
```

Then run:

```bash
npm run capture:demo
```

If Playwright is not installed locally, run the script with the bundled Codex runtime or install Playwright as a dev dependency.

## Generate Pitch Deck

```bash
npm run deck:build
```

The deck automatically uses screenshots from `screenshots/` when they exist.
It uses Pretendard typography and a Carbon-inspired visual system: white canvas,
light gray surfaces, charcoal text, square geometry, 1px hairlines, and IBM Blue
as the only accent.

The current deck workflow borrows the practical idea from `slides-grab`: keep
screenshots and rendered review artifacts close to the deck, so the pitch can be
rebuilt quickly after product changes.
