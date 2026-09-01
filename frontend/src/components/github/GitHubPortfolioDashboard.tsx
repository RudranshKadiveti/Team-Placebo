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
      <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-500 text-xs font-medium">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
        Analyzing GitHub repositories & extracting engineering evidence...
      </div>
    );
  }

  // Calculate languages for the orbital graph
  const uniqueLanguages = portfolioData 
    ? Array.from(new Set(portfolioData.topRepositories.map(r => r.primaryLanguage).filter(Boolean))).slice(0, 8)
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Messages */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* CONNECT FORM / STATUS HEADER */}
      <section className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white shadow-md">
            <Github className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-800">GitHub Portfolio Intelligence</h3>
              {status?.connected && (
                <span className="text-[10px] uppercase font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md tracking-wide">
                  Connected: @{status.username}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
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
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-slate-900/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Data'}
            </button>
            <button
              onClick={handleDisconnect}
              title="Disconnect GitHub account"
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm"
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
              placeholder="GitHub Username"
              required
              className="bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-medium outline-none w-full sm:w-48 transition-all"
            />
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="GitHub PAT (Optional)"
              className="bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-medium outline-none w-full sm:w-48 transition-all"
            />
            <button
              type="submit"
              disabled={syncing}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-slate-900/20 shrink-0"
            >
              <Github className="w-4 h-4" />
              {syncing ? 'Connecting...' : 'Connect'}
            </button>
          </form>
        )}
      </section>

      {/* DASHBOARD CONTENT (WHEN CONNECTED) */}
      {status?.connected && portfolioData && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* LEFT: Orbital Graph (Light Theme adaptation of Image 2) */}
            <section className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center relative min-h-[400px] overflow-hidden">
              <h3 className="absolute top-6 left-6 text-sm font-bold text-slate-800">Tech Stack Constellation</h3>
              
              {/* Background Orbits */}
              <div className="absolute w-64 h-64 border border-slate-100 rounded-full"></div>
              <div className="absolute w-96 h-96 border border-slate-100 rounded-full border-dashed"></div>
              
              {/* Central Node */}
              <div className="relative w-20 h-20 bg-emerald-500 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center text-white font-black text-xl z-10 border-4 border-white">
                ME
              </div>

              {/* Orbiting Language Nodes */}
              {uniqueLanguages.map((lang, index) => {
                const angle = (index / uniqueLanguages.length) * 2 * Math.PI;
                const radius = index % 2 === 0 ? 120 : 180; // alternate between inner and outer orbit
                const top = `calc(50% + ${Math.sin(angle) * radius}px)`;
                const left = `calc(50% + ${Math.cos(angle) * radius}px)`;

                return (
                  <div 
                    key={index} 
                    className="absolute flex flex-col items-center justify-center gap-1 transform -translate-x-1/2 -translate-y-1/2 group"
                    style={{ top, left }}
                  >
                    <div className="w-10 h-10 bg-white border-2 border-emerald-400 rounded-full shadow-md flex items-center justify-center text-[10px] font-bold text-slate-700 group-hover:scale-110 group-hover:border-emerald-500 group-hover:bg-emerald-50 transition-all cursor-default relative">
                      {lang?.substring(0, 2).toUpperCase()}
                      
                      {/* Connection Line to center (simulated via rotated div) */}
                      <div 
                         className="absolute w-px bg-slate-200 -z-10" 
                         style={{
                           height: `${radius - 30}px`,
                           bottom: '50%',
                           transformOrigin: 'bottom',
                           transform: `rotate(${angle * (180/Math.PI) + 90}deg)`,
                         }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-100">{lang}</span>
                  </div>
                );
              })}
            </section>

            {/* RIGHT: Language Proficiency Card & Stats */}
            <section className="space-y-6">
              
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden text-white flex flex-col items-center justify-center min-h-[200px]">
                {/* Imitating the dark UI card from Image 2 just for this specific proficiency widget to add contrast, or keep it light?
                    User said "change the dark theme in image 2 to white as well". Let's make this card white! */}
              </div>

              {/* RE-DO RIGHT PANEL AS WHITE THEME */}
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden flex flex-col min-h-[400px]">
                
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-full border-2 border-emerald-400 flex items-center justify-center text-slate-700 font-bold bg-emerald-50 shadow-inner">
                       {uniqueLanguages[0]?.substring(0, 2).toUpperCase() || 'JS'}
                     </div>
                     <div>
                       <h4 className="text-xl font-black text-slate-800 tracking-tight">{uniqueLanguages[0] || 'JavaScript'}</h4>
                       <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">ADVANCED</span>
                     </div>
                  </div>
                </div>

                <div className="space-y-2 mb-8">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Proficiency</span>
                    <span className="text-emerald-500">{portfolioData.portfolio.portfolioStrengthScore}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${portfolioData.portfolio.portfolioStrengthScore}%` }}></div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4 border-b border-slate-100 pb-2">
                    // RELATED PROJECTS
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {portfolioData.topRepositories.slice(0, 5).map(repo => (
                      <div key={repo.githubRepoId} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors shadow-sm">
                        {repo.name}
                      </div>
                    ))}
                    {portfolioData.topRepositories.length > 5 && (
                      <div className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-500 shadow-sm">
                        +{portfolioData.topRepositories.length - 5} more
                      </div>
                    )}
                  </div>
                </div>

                <div className="absolute right-6 bottom-6 h-32 w-1.5 bg-slate-100 rounded-full overflow-hidden">
                   <div className="absolute bottom-0 w-full bg-emerald-400 rounded-full" style={{ height: '75%' }}></div>
                </div>

              </div>

            </section>
          </div>

          {/* TOP HIGHLIGHTED PROJECTS GRID */}
          <section className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-500 border border-blue-100">
                  <Code2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Top Technical Projects</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                Ranked by Technical Relevance
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolioData.topRepositories.map((repo) => (
                <div
                  key={repo.githubRepoId}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-all flex flex-col justify-between gap-4 group shadow-sm hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100 uppercase tracking-wider">
                        {repo.classification}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                          Complexity: {repo.complexityScore}
                        </span>
                        <a
                          href={repo.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                    <h4 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {repo.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 font-medium leading-relaxed">
                      {repo.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500 font-semibold">
                      Primary: <strong className="text-slate-700">{repo.primaryLanguage || 'Software'}</strong>
                    </span>
                    <button
                      onClick={() => handleInspectRepo(repo)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Inspect Bullets
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* RESUME ↔ GITHUB SKILL EVIDENCE MATRIX */}
          <section className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-500 border border-emerald-100">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Resume ↔ GitHub Evidence Matrix</h3>
                  <span className="text-xs font-medium text-slate-500">Verified Against Repository Manifests</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolioData.skillMatrix.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border text-xs flex items-center justify-between transition-colors shadow-sm ${
                    item.category === 'Strong Evidence'
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : item.category === 'GitHub Only'
                      ? 'bg-purple-50/50 border-purple-200'
                      : item.category === 'Resume Only'
                      ? 'bg-slate-50/50 border-slate-200'
                      : 'bg-blue-50/50 border-blue-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="font-extrabold text-slate-800 text-sm">{item.skill}</span>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        item.category === 'Strong Evidence' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        item.category === 'GitHub Only' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        item.category === 'Resume Only' ? 'bg-slate-200 text-slate-700 border-slate-300' :
                        'bg-blue-100 text-blue-700 border-blue-200'
                      }`}>
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-600">{item.recommendation}</p>
                  </div>

                  {item.repoCount > 0 && (
                    <span className="text-[10px] font-mono font-bold bg-white text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 shadow-sm shrink-0">
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
