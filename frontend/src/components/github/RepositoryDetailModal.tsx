import React, { useState } from 'react';
import { AnalyzedRepo } from '../../services/githubService';
import { X, ExternalLink, Sparkles, Cpu, Code2, Copy, Check } from 'lucide-react';

interface RepositoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  repo: AnalyzedRepo | null;
  bullets: string[];
}

export const RepositoryDetailModal: React.FC<RepositoryDetailModalProps> = ({
  isOpen,
  onClose,
  repo,
  bullets,
}) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  if (!isOpen || !repo) return null;

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-semibold">
                {repo.classification}
              </span>
              {repo.isFork && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold">
                  Forked
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {repo.name}
              <a
                href={repo.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-blue-400 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </h2>
            <p className="text-xs text-slate-400 mt-1">{repo.description || 'No description provided.'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Breakdown Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Complexity</span>
            <span className="text-lg font-black text-indigo-400">{repo.complexityScore}/100</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Health</span>
            <span className="text-lg font-black text-emerald-400">{repo.healthScore}/100</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Documentation</span>
            <span className="text-lg font-black text-blue-400">{repo.documentationScore}/100</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Testing</span>
            <span className="text-lg font-black text-purple-400">{repo.testingScore}/100</span>
          </div>
        </div>

        {/* Technologies Detected */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-blue-400" /> Detected Frameworks & Manifest Evidence
          </h4>
          <div className="flex flex-wrap gap-2">
            {repo.technologies.length > 0 ? (
              repo.technologies.map((t, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5"
                >
                  <Code2 className="w-3 h-3 text-indigo-400" /> {t.name}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">No specific manifest dependencies detected.</span>
            )}
          </div>
        </div>

        {/* AI Evidence-Grounded Resume Bullets */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/30 to-purple-950/30 border border-indigo-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                AI Evidence-Grounded Resume Bullets
              </h4>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Zero Hallucination
            </span>
          </div>

          <div className="space-y-2.5">
            {bullets.map((bullet, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 flex items-start justify-between gap-3 group"
              >
                <p className="leading-relaxed">{bullet}</p>
                <button
                  onClick={() => handleCopy(bullet, idx)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white shrink-0 transition-colors"
                >
                  {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Close Inspection
          </button>
        </div>
      </div>
    </div>
  );
};
