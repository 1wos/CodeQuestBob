import { useState } from 'react';
import { CheckCircle2, FileAudio2, Loader2, Mic2, Volume2 } from 'lucide-react';
import './BobBriefingPanel.css';

type BriefingResponse = {
  mode: 'live' | 'unavailable';
  checkedAt: string;
  totalLatencyMs: number;
  briefingText: string;
  transcript: string;
  audioDataUrl: string;
  sources: string[];
};

type BobBriefingPanelProps = {
  title: string;
  subtitle: string;
  objectives: string[];
};

export function BobBriefingPanel({ title, subtitle, objectives }: BobBriefingPanelProps) {
  const [briefing, setBriefing] = useState<BriefingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('Audio briefing is ready when speech services are available.');

  const generateBriefing = async () => {
    setIsLoading(true);
    setStatusText('Preparing an audio briefing and transcript check.');

    try {
      const response = await fetch('/api/ibm/briefing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          subtitle,
          objectives,
        }),
      });

      const payload = (await response.json()) as BriefingResponse;
      setBriefing(payload);
      setStatusText(
        payload.mode === 'live'
          ? 'Audio briefing and transcript are ready.'
          : 'Audio briefing is not available right now. The written quest brief still works.',
      );
    } catch {
      setBriefing(null);
      setStatusText('Audio briefing is not available right now. Continue with the written quest brief.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasLiveAudio = briefing?.mode === 'live' && Boolean(briefing.audioDataUrl);

  return (
    <section className="bob-briefing-panel" aria-label="IBM speech briefing">
      <div className="bob-briefing-header">
        <div>
          <p className="bob-briefing-kicker">IBM speech UX</p>
          <h2>Bob briefing and teach-back loop</h2>
          <p>
            The quest can be listened to as an onboarding briefing, then verified through IBM
            Speech to Text so the demo shows speech inside the product flow.
          </p>
        </div>
        <FileAudio2 size={28} aria-hidden="true" />
      </div>

      <div className="bob-briefing-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={isLoading}
          onClick={generateBriefing}
        >
          {isLoading ? <Loader2 className="briefing-spinner" size={18} /> : <Volume2 size={18} />}
          Generate Bob briefing
        </button>
        <span className="briefing-status">{statusText}</span>
      </div>

      {briefing && (
        <div className="briefing-results">
          <div className="briefing-status-row">
            <span>
              <Volume2 size={16} aria-hidden="true" />
              IBM Text to Speech
            </span>
            <strong>{hasLiveAudio ? 'Live audio ready' : 'Paused'}</strong>
          </div>
          <div className="briefing-status-row">
            <span>
              <Mic2 size={16} aria-hidden="true" />
              IBM Speech to Text
            </span>
            <strong>{briefing.transcript ? 'Transcript verified' : 'Waiting'}</strong>
          </div>

          {hasLiveAudio && (
            <audio className="briefing-audio" controls src={briefing.audioDataUrl}>
              <track kind="captions" />
            </audio>
          )}

          {briefing.briefingText && (
            <div className="briefing-copy">
              <span>Briefing script</span>
              <p>{briefing.briefingText}</p>
            </div>
          )}

          {briefing.transcript && (
            <div className="briefing-copy">
              <span>
                <CheckCircle2 size={16} aria-hidden="true" />
                STT transcript
              </span>
              <p>{briefing.transcript}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
