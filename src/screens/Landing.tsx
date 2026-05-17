import { useState } from 'react';
import { useApp } from '../app/useApp';
import { IBMBobBadge } from '../components/ui/IBMBobBadge';
import {
  BarChart3,
  Database,
  Search,
  GitBranch,
  Target,
  Map,
  Award,
  ArrowRight,
  CheckCircle2,
  GitPullRequest,
  Gauge,
  Route,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import './Landing.css';

const sampleRepos = [
  { name: 'codequest-bob', url: 'https://github.com/ideation-lab/codequest-bob' },
  { name: 'react', url: 'https://github.com/facebook/react' },
  { name: 'typescript', url: 'https://github.com/microsoft/TypeScript' },
];

export function Landing() {
  const { navigateTo, passport } = useApp();
  const [repoUrl, setRepoUrl] = useState('');
  const [selectedSample, setSelectedSample] = useState(sampleRepos[0].url);

  const handleScan = () => {
    navigateTo('repo-scan');
  };

  return (
    <div className="landing-screen">
      <main className="workspace-dashboard">
        <section className="workspace-header">
          <div className="workspace-heading">
            <IBMBobBadge variant="compact" />
            <p className="workspace-kicker">Developer workspace</p>
            <h1>Developer Growth OS</h1>
            <p>
              Convert repository context into onboarding quests, guided progress,
              and IBM-powered learning support for every new contributor.
            </p>
          </div>
          <div className="workspace-actions">
            <button className="btn btn-primary" onClick={handleScan}>
              <Search size={18} />
              Intake repository
            </button>
            <button className="btn btn-ghost" onClick={() => navigateTo('quest-map')}>
              <Map size={18} />
              Open quest map
            </button>
          </div>
        </section>

        <section className="metric-grid" aria-label="Workspace metrics">
          <div className="metric-card">
            <Route size={18} />
            <span className="metric-value">4</span>
            <span className="metric-label">Quest stages</span>
          </div>
          <div className="metric-card">
            <Database size={18} />
            <span className="metric-value">4</span>
            <span className="metric-label">IBM APIs live</span>
          </div>
          <div className="metric-card">
            <Award size={18} />
            <span className="metric-value">{passport.stats.badgesEarned}</span>
            <span className="metric-label">Badges earned</span>
          </div>
          <div className="metric-card">
            <BarChart3 size={18} />
            <span className="metric-value">{passport.stats.totalXP}</span>
            <span className="metric-label">Workspace XP</span>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-card intake-card">
            <div className="card-heading">
              <div>
                <p className="section-kicker">Repository intake</p>
                <h2>Scan a codebase into a growth plan</h2>
              </div>
              <Search className="card-heading-icon" />
            </div>

            <div className="scan-input-group">
              <label htmlFor="repo-url">Repository URL</label>
              <div className="repo-input-shell">
                <GitBranch size={18} />
                <input
                  id="repo-url"
                  type="text"
                  className="repo-input"
                  placeholder="https://github.com/owner/repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                />
              </div>
            </div>

            <fieldset className="sample-repos">
              <legend>Sample workspaces</legend>
              <div className="sample-buttons">
                {sampleRepos.map((repo) => (
                  <button
                    type="button"
                    key={repo.url}
                    className={`sample-btn ${selectedSample === repo.url ? 'active' : ''}`}
                    aria-pressed={selectedSample === repo.url}
                    onClick={() => {
                      setSelectedSample(repo.url);
                      setRepoUrl(repo.url);
                    }}
                  >
                    {repo.name}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="scan-actions-row">
              <button className="btn btn-primary" onClick={handleScan}>
                Generate growth plan
                <ArrowRight size={18} />
              </button>
              <div className="scan-status">
                <CheckCircle2 size={16} className="status-icon" />
                IBM services connected
              </div>
            </div>
          </div>

          <div className="dashboard-card pipeline-card">
            <div className="card-heading">
              <div>
                <p className="section-kicker">Growth pipeline</p>
                <h2>Quest stages</h2>
              </div>
              <Gauge className="card-heading-icon" />
            </div>

            <div className="pipeline-list">
              <button className="pipeline-item" onClick={() => navigateTo('quest-map')}>
                <span className="pipeline-icon explorer">
                  <Wrench size={18} />
                </span>
                <span>
                  <strong>Setup Quest</strong>
                  <small>Install, run, and verify the project locally</small>
                </span>
                <em>75 XP</em>
              </button>
              <button className="pipeline-item" onClick={() => navigateTo('quest-map')}>
                <span className="pipeline-icon contributor">
                  <Map size={18} />
                </span>
                <span>
                  <strong>Explore Quest</strong>
                  <small>Navigate architecture, files, and entry points</small>
                </span>
                <em>125 XP</em>
              </button>
              <button className="pipeline-item" onClick={() => navigateTo('quest-map')}>
                <span className="pipeline-icon responder">
                  <Target size={18} />
                </span>
                <span>
                  <strong>Improve Quest</strong>
                  <small>Pick a scoped improvement and validate it</small>
                </span>
                <em>225 XP</em>
              </button>
              <button className="pipeline-item" onClick={() => navigateTo('quest-map')}>
                <span className="pipeline-icon contributor">
                  <GitPullRequest size={18} />
                </span>
                <span>
                  <strong>First PR Quest</strong>
                  <small>Package a beginner-safe PR for review</small>
                </span>
                <em>350 XP</em>
              </button>
            </div>
          </div>

          <div className="dashboard-card passport-card">
            <div className="card-heading compact">
              <div>
                <p className="section-kicker">Developer passport</p>
                <h2>Growth record</h2>
              </div>
              <ShieldCheck className="card-heading-icon" />
            </div>
            <div className="passport-preview">
              <div>
                <span>{passport.stats.totalXP}</span>
                <small>Total XP</small>
              </div>
              <div>
                <span>{passport.stats.questsCompleted}</span>
                <small>Quests done</small>
              </div>
              <div>
                <span>{passport.ibmBobUsage.sessionsExported.length}</span>
                <small>AI reports</small>
              </div>
            </div>
            <button className="card-link" onClick={() => navigateTo('passport')}>
              View passport
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        <section className="workspace-footer">
          <button onClick={() => navigateTo('passport')}>
            Developer Passport
          </button>
          <button onClick={() => navigateTo('quest-map')}>
            Open quest map
          </button>
        </section>
      </main>
    </div>
  );
}

// Made with Bob
