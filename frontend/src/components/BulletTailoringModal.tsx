import React, { useState } from 'react';
import { BulletTailoringResult, resumeService } from '../services/resumeService';
import { Sparkles, Copy, Check, RefreshCw, Edit3, X, Zap, Lightbulb, AlertCircle, ArrowRight } from 'lucide-react';

interface BulletTailoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBullet?: string;
  targetRoleTitle?: string;
  targetJobDescription?: string;
  onReplaceBullet?: (improvedBullet: string) => void;
}

export const BulletTailoringModal: React.FC<BulletTailoringModalProps> = ({
  isOpen,
  onClose,
  initialBullet = '',
  targetRoleTitle = '',
  targetJobDescription = '',
  onReplaceBullet,
}) => {
  const [bulletText, setBulletText] = useState(initialBullet);
  const [roleTitle, setRoleTitle] = useState(targetRoleTitle);
  const [jobDesc, setJobDesc] = useState(targetJobDescription);
  const [additionalContext, setAdditionalContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulletTailoringResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBullet, setEditedBullet] = useState('');

  if (!isOpen) return null;

  const handleTailor = async () => {
    if (!bulletText.trim()) return;
    setLoading(true);
    try {
      const res = await resumeService.tailorBullet({
        bulletText,
        targetRoleTitle: roleTitle,
        targetJobDescription: jobDesc,
        additionalContext,
      });
      if (res.success && res.data) {
        setResult(res.data);
        setEditedBullet(res.data.rewritten);
        setIsEditing(false);
      }
    } catch {
      // Fallback handled gracefully by backend service
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = isEditing ? editedBullet : result?.rewritten || '';
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplace = () => {
    const textToReplace = isEditing ? editedBullet : result?.rewritten || '';
    if (onReplaceBullet && textToReplace) {
      onReplaceBullet(textToReplace);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">AI Resume Bullet Point Enhancer</h2>
              <p className="text-xs text-slate-400">Action Verb + Context + Tech Detail + Impact Structure</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Existing Bullet Point <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={bulletText}
              onChange={(e) => setBulletText(e.target.value)}
              placeholder="e.g. Worked on a web application using React and Node.js."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Target Job Title (Optional)</label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Senior Full-Stack Engineer"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Target Job Context (Optional)</label>
              <input
                type="text"
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                placeholder="e.g. Seeking microservices & REST API context"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Extra Metrics / Details (Optional)</label>
            <input
              type="text"
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="e.g. Reduced API latency, 10k daily users"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <button
            onClick={handleTailor}
            disabled={loading || !bulletText.trim()}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-blue-600/20 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Tailoring Bullet Point...' : 'Enhance Bullet Point with AI'}
          </button>
        </div>

        {/* Results Panel */}
        {result && (
          <div className="space-y-4 pt-4 border-t border-slate-800/80 animate-in fade-in duration-300">
            {/* Original vs Improved */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Original Bullet</span>
                <p className="text-xs text-slate-300 italic">{result.original}</p>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-slate-900 border border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Improved Bullet
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
                    >
                      <Edit3 className="w-3 h-3" /> {isEditing ? 'View' : 'Edit'}
                    </button>
                    <button
                      onClick={handleCopy}
                      className="p-1.5 rounded-md bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-xs flex items-center gap-1 transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <textarea
                    value={editedBullet}
                    onChange={(e) => setEditedBullet(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-blue-500/40 text-slate-100 text-xs focus:outline-none"
                  />
                ) : (
                  <p className="text-xs font-semibold text-slate-100 leading-relaxed">{result.rewritten}</p>
                )}
              </div>
            </div>

            {/* Explanations & Analysis Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Why it's better */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Why It's Better
                </span>
                <ul className="text-[11px] text-slate-300 space-y-1">
                  {result.improvements.map((imp, idx) => (
                    <li key={idx} className="leading-tight">• {imp}</li>
                  ))}
                </ul>
              </div>

              {/* Keywords added */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-indigo-400 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" /> Keywords Added
                </span>
                <div className="flex flex-wrap gap-1">
                  {result.keywords_added.length > 0 ? (
                    result.keywords_added.map((kw, idx) => (
                      <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">None added</span>
                  )}
                </div>
              </div>

              {/* Missing information */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Missing Metrics
                </span>
                {result.missing_information.length > 0 ? (
                  <ul className="text-[11px] text-slate-300 space-y-1">
                    {result.missing_information.map((info, idx) => (
                      <li key={idx} className="leading-tight text-amber-300/90">• {info}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-[11px] text-emerald-400 font-medium">Metrics included!</span>
                )}
              </div>
            </div>

            {/* Modal Controls */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={handleTailor}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate
              </button>

              {onReplaceBullet && (
                <button
                  onClick={handleReplace}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-600/20"
                >
                  Replace Original Bullet <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
