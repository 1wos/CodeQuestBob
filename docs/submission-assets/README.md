# CodeQuest Bob Submission Assets

This directory contains only the final material for the IBM Bob Hackathon submission.

- `codequest-bob-pitch-deck.pptx` - final slide presentation
- `rendered/codequest-bob-pitch-deck.pdf` - final PDF copy of the presentation
- `demo-video/codequest-bob-demo-voiceover.mp4` - final narrated demo video
- `demo-video/codequest-bob-demo-voiceover.srt` - subtitle file for the narrated demo
- `demo-video/narration-script.md` - voiceover script
- `demo-video-script.md` - short demo outline

Intermediate files such as raw browser recordings, screenshot frames, deck source HTML,
and contact sheets are intentionally ignored so the public repository stays focused on
the app source code and final submission artifacts.

## Regenerate Demo Video

```bash
npm run demo:final
```

This runs the browser demo automation and then adds the Azure Speech voiceover. If Azure
Speech is unavailable, the voiceover script falls back to the local macOS voice system.

The final pitch deck and PDF are committed as final artifacts and are not rebuilt during
normal app development.
