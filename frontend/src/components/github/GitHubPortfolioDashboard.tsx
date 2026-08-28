import React, { useEffect, useState } from 'react';
import { githubService, GitHubStatus, PortfolioData, AnalyzedRepo } from '../../services/githubService';
import { RepositoryDetailModal } from './RepositoryDetailModal';
import {
  Github,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Code2,
  ExternalLink,
  FileCheck,
  Zap,
  Unlink,
} from 'lucide-react';

export const GitHubPortfolioDashboard: React.FC = () => {
  const [status, setStatus] = useState<GitHubStatus | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [selectedRepo, setSelectedRepo] = useState<AnalyzedRepo | null>(null);
  const [modalBullets, setModalBullets] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadGitHubData();
  }, []);

  const loadGitHubData = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusRes = await githubService.getStatus();
      setStatus(statusRes);

      if (statusRes.connected) {
        const data = await githubService.getPortfolio();
        setPortfolioData(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load GitHub intelligence data.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    setSyncing(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await githubService.connect(usernameInput.trim(), tokenInput.trim() || undefined);
      setSuccessMsg(res.message);
      await loadGitHubData();
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || 'Failed to connect GitHub username.';
      setError(errMsg);
    } finally {
      setSyncing(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await githubService.sync();
      setSuccessMsg(res.message);
      await loadGitHubData();
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || 'Failed to synchronize GitHub data.';
      setError(errMsg);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your GitHub account?')) return;

    setSyncing(true);
    try {
      await githubService.disconnect();
      setStatus({ connected: false });
      setPortfolioData(null);
      setSuccessMsg('GitHub account disconnected.');
    } catch {
      setError('Failed to disconnect GitHub account.');
    } finally {
      setSyncing(false);
    }
  };

  const handleInspectRepo = async (repo: AnalyzedRepo) => {
    setSelectedRepo(repo);
    setIsModalOpen(true);
    try {
      const detail = await githubService.getRepositoryDetail(repo.githubRepoId.toString());
      setModalBullets(detail.bullets);
    } catch {
      setModalBullets([
        `Engineered ${repo.classification.toLowerCase()} using ${repo.primaryLanguage || 'modern software principles'}.`,
      ]);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-3xl text-slate-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-400" />
        Analyzing GitHub repositories & extracting engineering evidence...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Messages */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* CONNECT FORM / STATUS HEADER */}
      <section className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-slate-800 text-slate-200 border border-slate-700">
            <Github className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">GitHub Portfolio Intelligence</h3>
              {status?.connected && (
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Connected: @{status.username}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {status?.connected
                ? `Synchronized ${status.repoCount || 0} repositories (Last synced: ${status.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleTimeString() : 'Just now'})`
                : 'Connect your GitHub account to generate data-driven portfolio analytics & evidence.'}
            </p>
          </div>
        </div>

        {status?.connected ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync GitHub'}
            </button>
            <button
              onClick={handleDisconnect}
              title="Disconnect GitHub account"
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition-all"
            >
              <Unlink className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleConnect} className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="GitHub Username (e.g. suraj14611)"
              required
              className="bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none w-full sm:w-44"
            />
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="GitHub PAT (Optional - Bypasses Rate Limits)"
              className="bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none w-full sm:w-56"
            />
            <button
              type="submit"
              disabled={syncing}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/20 shrink-0"
            >
              <Github className="w-3.5 h-3.5" />
              {syncing ? 'Connecting...' : 'Connect'}
            </button>
          </form>
        )}
      </section>

      {/* DASHBOARD CONTENT (WHEN CONNECTED) */}
      {status?.connected && portfolioData && (
        <div className="space-y-6">
          {/* TOP METRIC ROW: PORTFOLIO STRENGTH SCORE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 text-center flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                GitHub Portfolio Strength Score
              </span>

              <div className="relative w-28 h-28 flex items-center justify-center mb-3">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-400 transition-all duration-1000"
                    strokeDasharray={`${portfolioData.portfolio.portfolioStrengthScore}, 100`}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-white">
                    {portfolioData.portfolio.portfolioStrengthScore}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-bold">/ 100</span>
                </div>
              </div>

              <span className="text-xs font-semibold text-blue-300">
                {portfolioData.portfolio.portfolioStrengthScore >= 75
                  ? 'Strong Technical Portfolio'
                  : 'Developing Portfolio'}
              </span>
            </div>

            {/* STRENGTHS & IMPROVEMENT AREAS */}
            <div className="md:col-span-2 p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Evidence-Based Insights
                </h4>
                <div className="space-y-2">
                  {portfolioData.portfolio.strengths.map((str, i) => (
                    <p key={i} className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-medium">
                      {str}
                    </p>
                  ))}
                  {portfolioData.portfolio.improvements.map((imp, i) => (
                    <p key={i} className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl font-medium">
                      {imp}
                    </p>
                  ))}
                </div>
              </div>

              {/* Sub-breakdown bars */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-center text-[10px]">
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 block">Depth</span>
                  <span className="font-bold text-slate-200">{portfolioData.portfolio.technicalDepthScore}/100</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 block">Quality</span>
                  <span className="font-bold text-slate-200">{portfolioData.portfolio.projectQualityScore}/100</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 block">Docs</span>
                  <span className="font-bold text-slate-200">{portfolioData.portfolio.documentationScore}/100</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 block">Testing</span>
                  <span className="font-bold text-slate-200">{portfolioData.portfolio.testingScore}/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* TOP HIGHLIGHTED PROJECTS GRID */}
          <section className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Top Technical Projects</h3>
              </div>
              <span className="text-xs text-slate-400">Ranked by Technical Relevance</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolioData.topRepositories.map((repo) => (
                <div
                  key={repo.githubRepoId}
                  className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between gap-3 group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-semibold border border-blue-500/20">
                        {repo.classification}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          Complexity: {repo.complexityScore}
                        </span>
                        <a
                          href={repo.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-500 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                      {repo.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {repo.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Primary: <strong className="text-slate-200">{repo.primaryLanguage || 'Software'}</strong>
                    </span>
                    <button
                      onClick={() => handleInspectRepo(repo)}
                      className="px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <Sparkles className="w-3 h-3" /> Inspect Bullets
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* RESUME ↔ GITHUB SKILL EVIDENCE MATRIX */}
          <section className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Resume ↔ GitHub Evidence Matrix</h3>
              </div>
              <span className="text-xs text-slate-400">Verified Against Repository Manifests</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {portfolioData.skillMatrix.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
                    item.category === 'Strong Evidence'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : item.category === 'GitHub Only'
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-200'
                      : item.category === 'Resume Only'
                      ? 'bg-slate-900 border-slate-800 text-slate-300'
                      : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-white text-sm">{item.skill}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-950/60 border border-slate-800">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-80">{item.recommendation}</p>
                  </div>

                  {item.repoCount > 0 && (
                    <span className="text-[10px] font-mono font-bold bg-slate-950 px-2 py-1 rounded-md border border-slate-800 shrink-0">
                      {item.repoCount} {item.repoCount === 1 ? 'Repo' : 'Repos'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* REPOSITORY INSPECTION MODAL */}
      <RepositoryDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        repo={selectedRepo}
        bullets={modalBullets}
      />
    </div>
  );
};
