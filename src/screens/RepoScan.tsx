import { useState } from 'react';
import { useApp } from '../app/useApp';
import { IBMBobBadge } from '../components/ui/IBMBobBadge';
import { ExternalLink, FileText, FolderTree, GitPullRequest, Loader2, RefreshCw, Target, Terminal } from 'lucide-react';
import './RepoScan.css';

const setupCommands = ['npm install', 'npm run dev', 'npm run build'];

const spatialMapNodes = [
  { label: 'Workspace flow', role: 'Where contributors start and continue the journey' },
  { label: 'Quest experience', role: 'Guided tasks, progress, and completion history' },
  { label: 'Skill radar', role: 'Learning recommendations connected to the current quest' },
  { label: 'IBM services', role: 'Model, language, and speech services used by the experience' },
];

type GithubRepoSummary = {
  repoName: string;
  repoUrl: string;
  description: string;
  defaultBranch: string;
  stars: number;
  forks: number;
  openIssues: number;
  updatedAt: string;
  languages: Record<string, number>;
  rootFiles: Array<{ name: string; type: 'file' | 'dir'; path: string }>;
  entryPoints: string[];
  keyDirectories: string[];
};

type GithubRepoScanResponse = {
  mode: 'live' | 'unavailable' | 'invalid';
  checkedAt?: string;
  detail?: string;
  summary?: GithubRepoSummary;
};

export function RepoScan() {
  const { navigateTo, repoScan } = useApp();
  const [liveRepoUrl, setLiveRepoUrl] = useState(repoScan?.repoUrl || '');
  const [liveSummary, setLiveSummary] = useState<GithubRepoSummary | null>(null);
  const [liveScanStatus, setLiveScanStatus] = useState('Paste a public GitHub repository URL to refresh repository context.');
  const [isLiveScanning, setIsLiveScanning] = useState(false);

  if (!repoScan) {
    return <div>Loading...</div>;
  }

  const runLiveGithubScan = async () => {
    setIsLiveScanning(true);
    setLiveScanStatus('Reading public repository context from GitHub.');

    try {
      const response = await fetch(`/api/github/repo-scan?${new URLSearchParams({ repoUrl: liveRepoUrl })}`);
      const payload = (await response.json()) as GithubRepoScanResponse;

      if (payload.mode === 'live' && payload.summary) {
        setLiveSummary(payload.summary);
        setLiveScanStatus('Live GitHub metadata is connected to this repository intake.');
      } else {
        setLiveSummary(null);
        setLiveScanStatus(payload.detail || 'Repository context is not available right now. You can continue with the current growth plan.');
      }
    } catch {
      setLiveSummary(null);
      setLiveScanStatus('Repository context is not available right now. You can continue with the current growth plan.');
    } finally {
      setIsLiveScanning(false);
    }
  };

  return (
    <div className="repo-scan-screen">
      <div className="scan-header">
        <h1>Repository Analysis</h1>
        <IBMBobBadge variant="compact" />
      </div>

      <div className="scan-content">
        <div className="scan-info">
          <h2>{repoScan.repoName}</h2>
          <p className="scan-url">{repoScan.repoUrl}</p>
          <p className="scan-date">
            Scanned: {new Date(repoScan.scannedAt).toLocaleString()}
          </p>
        </div>

        <form
          className="live-repo-scan"
          onSubmit={(event) => {
            event.preventDefault();
            void runLiveGithubScan();
          }}
        >
          <div className="live-repo-copy">
            <p className="section-kicker">Live repository intake</p>
            <h3>Refresh with GitHub metadata</h3>
            <p>{liveScanStatus}</p>
          </div>
          <div className="live-repo-controls">
            <label htmlFor="live-repo-url">GitHub repository URL</label>
            <div className="live-repo-input-row">
              <input
                id="live-repo-url"
                type="url"
                value={liveRepoUrl}
                placeholder="https://github.com/owner/repo"
                onChange={(event) => setLiveRepoUrl(event.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={isLiveScanning}>
                {isLiveScanning ? <Loader2 className="scan-spinner" size={18} /> : <RefreshCw size={18} />}
                Refresh
              </button>
            </div>
          </div>

          {liveSummary && (
            <div className="live-repo-result">
              <div className="live-repo-title">
                <div>
                  <h4>{liveSummary.repoName}</h4>
                  <p>{liveSummary.description}</p>
                </div>
                <a href={liveSummary.repoUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={16} />
                  GitHub
                </a>
              </div>
              <dl className="live-repo-metrics">
                <div>
                  <dt>Default branch</dt>
                  <dd>{liveSummary.defaultBranch}</dd>
                </div>
                <div>
                  <dt>Stars</dt>
                  <dd>{liveSummary.stars.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Open issues</dt>
                  <dd>{liveSummary.openIssues.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>{new Date(liveSummary.updatedAt).toLocaleDateString()}</dd>
                </div>
              </dl>
              <div className="live-repo-detail-grid">
                <section>
                  <h5>Live languages</h5>
                  <ul>
                    {Object.entries(liveSummary.languages).map(([language, percent]) => (
                      <li key={language}>
                        <span>{language}</span>
                        <strong>{percent}%</strong>
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h5>Root structure</h5>
                  <ul>
                    {liveSummary.rootFiles.slice(0, 8).map((item) => (
                      <li key={item.path}>
                        <code>{item.type === 'dir' ? `${item.name}/` : item.name}</code>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          )}
        </form>

        <div className="scan-stats">
          <div className="stat-card">
            <div className="stat-value">{repoScan.stats.totalFiles}</div>
            <div className="stat-label">Files</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{repoScan.stats.totalLines.toLocaleString()}</div>
            <div className="stat-label">Lines of Code</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{repoScan.stats.complexity}</div>
            <div className="stat-label">Complexity</div>
          </div>
        </div>

        <div className="scan-section">
          <h3>Languages</h3>
          <div className="language-bars">
            {Object.entries(repoScan.stats.languages).map(([lang, percent]) => (
              <div key={lang} className="language-bar">
                <div className="language-info">
                  <span className="language-name">{lang}</span>
                  <span className="language-percent">{percent}%</span>
                </div>
                <div className="language-progress">
                  <div className="language-fill" style={{ width: `${percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="scan-section">
          <h3>Repository Overview</h3>
          <div className="repo-overview-grid">
            <div className="repo-overview-panel">
              <h4>
                <FileText size={18} />
                Entry points
              </h4>
              <ul>
                {repoScan.insights.mainEntryPoints.map((entry) => (
                  <li key={entry}>
                    <code>{entry}</code>
                  </li>
                ))}
              </ul>
            </div>
            <div className="repo-overview-panel">
              <h4>
                <FolderTree size={18} />
                Key directories
              </h4>
              <ul>
                {repoScan.insights.keyDirectories.map((directory) => (
                  <li key={directory}>
                    <code>{directory}</code>
                  </li>
                ))}
              </ul>
            </div>
            <div className="repo-overview-panel">
              <h4>
                <Terminal size={18} />
                Setup commands
              </h4>
              <ul>
                {setupCommands.map((command) => (
                  <li key={command}>
                    <code>{command}</code>
                  </li>
                ))}
              </ul>
            </div>
            <div className="repo-overview-panel">
              <h4>
                <Target size={18} />
                Starting points
              </h4>
              <ul>
                {repoScan.insights.contributionOpportunities.slice(0, 3).map((opportunity) => (
                  <li key={opportunity}>{opportunity}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="scan-section">
          <h3>Onboarding Map Preview</h3>
          <div className="spatial-map-preview" aria-label="Onboarding map preview">
            {spatialMapNodes.map((node) => (
              <div key={node.label} className="spatial-map-node">
                <strong>{node.label}</strong>
                <span>{node.role}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="scan-section">
          <h3>IBM Bob Analysis</h3>
          <div className="bob-analysis">
            <div className="bob-stat">
              <span className="bob-label">Session ID:</span>
              <code>{repoScan.bobAnalysis.sessionId}</code>
            </div>
            <div className="bob-stat">
              <span className="bob-label">Analysis Time:</span>
              <span>{repoScan.bobAnalysis.analysisTime}s</span>
            </div>
            <div className="bob-stat">
              <span className="bob-label">Tokens Used:</span>
              <span>{repoScan.bobAnalysis.tokensUsed.toLocaleString()}</span>
            </div>
          </div>
          <div className="bob-recommendations">
            <h4>Recommendations:</h4>
            <ul>
              {repoScan.bobAnalysis.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="scan-actions">
          <button className="btn btn-primary" onClick={() => navigateTo('quest-map')}>
            <GitPullRequest size={18} />
            Generate First PR growth path
          </button>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
