import React, { useState } from 'react';
import { RoleAnalysisResult, ActionPlanItem, resumeService } from '../services/resumeService';
import { Target, Search, CheckCircle2, AlertTriangle, Lightbulb, Zap, Clock, Code2, RefreshCw, ChevronRight, BarChart3, Rocket } from 'lucide-react';

interface RoleAnalysisDashboardProps {
  resumeId: string;
}

export const RoleAnalysisDashboard: React.FC<RoleAnalysisDashboardProps> = ({ resumeId }) => {
  const [targetTitle, setTargetTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<RoleAnalysisResult | null>(null);
  const [actionPlan, setActionPlan] = useState<ActionPlanItem[] | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [activeTab, setActiveTab] = useState<'strong' | 'partial' | 'gaps' | 'keywords' | 'experience'>('gaps');

  const handleAnalyze = async () => {
    if (!targetTitle.trim() && !jobDescription.trim()) return;
    setLoading(true);
    setAnalysisResult(null);
    setActionPlan(null);

    try {
      const res = await resumeService.analyzeRole({
        resumeId,
        targetRoleTitle: targetTitle.trim() || undefined,
        targetJobDescription: jobDescription.trim() || undefined,
      });

      if (res.success && res.data) {
        setAnalysisResult(res.data);
        
        // Auto fetch Action Plan
        setLoadingPlan(true);
        try {
          const planRes = await resumeService.getActionPlan({
            targetRoleTitle: res.data.targetRoleTitle,
            targetJobDescription: res.data.targetJobDescription,
            skillGaps: res.data.skillGaps,
            partialMatches: res.data.partialMatches,
            missingKeywords: res.data.missingKeywords,
            experienceGaps: res.data.experienceGaps,
          });
          if (planRes.success && planRes.data) {
            setActionPlan(planRes.data);
          }
        } catch {
          // Fallback handled gracefully
        } finally {
          setLoadingPlan(false);
        }
      }
    } catch {
      // Fallback handled gracefully
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: TARGET ROLE INPUT */}
      <section className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Target Role Analysis</h2>
            <p className="text-xs text-slate-400">
              Compare your resume against a target job title or complete job description.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target Job Title (Optional if JD provided)
            </label>
            <input
              type="text"
              value={targetTitle}
              onChange={(e) => setTargetTitle(e.target.value)}
              placeholder="e.g. Senior Backend Engineer / Full-Stack Developer"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Complete Job Description (Primary Source for Keyword Extraction)
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste full job description text here (requirements, responsibilities, tech stack)..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || (!targetTitle.trim() && !jobDescription.trim())}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Analyzing Resume Against Target Role...' : 'Analyze Target Role Match'}
          </button>
        </div>
      </section>

      {/* SECTION 2: MATCH SCORE & CATEGORIZATION DASHBOARD */}
      {analysisResult && (
        <section className="space-y-6 animate-in fade-in duration-300">
          {/* Resume-to-Role Match Score Header Card */}
          <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/80 pb-6">
              <div className="flex items-center gap-4">
                {/* Score Gauge */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-indigo-400 transition-all duration-1000"
                      strokeDasharray={`${analysisResult.overallMatchScore}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xl font-black text-indigo-400">{analysisResult.overallMatchScore}%</span>
                    <span className="text-[8px] text-slate-400 uppercase font-bold">Match</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs uppercase tracking-wider text-indigo-400 font-bold block mb-0.5">
                    Compatibility Index
                  </span>
                  <h3 className="text-xl font-extrabold text-white">Resume-to-Role Match Score</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Evaluated for <span className="text-indigo-300 font-semibold">{analysisResult.targetRoleTitle}</span>
                  </p>
                </div>
              </div>

              {/* Configurable Breakdown Bars */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:w-1/2">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Skills (30%)</span>
                  <span className="text-sm font-bold text-slate-100">{analysisResult.scoreBreakdown.skillsMatch}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Keywords (25%)</span>
                  <span className="text-sm font-bold text-slate-100">{analysisResult.scoreBreakdown.keywordMatch}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Experience (20%)</span>
                  <span className="text-sm font-bold text-slate-100">{analysisResult.scoreBreakdown.experienceMatch}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Projects (15%)</span>
                  <span className="text-sm font-bold text-slate-100">{analysisResult.scoreBreakdown.projectRelevance}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center sm:col-span-2">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Tech Stack (10%)</span>
                  <span className="text-sm font-bold text-slate-100">{analysisResult.scoreBreakdown.technicalStackMatch}%</span>
                </div>
              </div>
            </div>

            {/* Findings Categorization Tabs */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
                <button
                  onClick={() => setActiveTab('gaps')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'gaps'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Skill Gaps ({analysisResult.skillGaps.length})
                </button>
                <button
                  onClick={() => setActiveTab('strong')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'strong'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Strong Matches ({analysisResult.strongMatches.length})
                </button>
                <button
                  onClick={() => setActiveTab('partial')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'partial'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Partial Matches ({analysisResult.partialMatches.length})
                </button>
                <button
                  onClick={() => setActiveTab('keywords')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'keywords'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Missing Keywords ({analysisResult.missingKeywords.length})
                </button>
                <button
                  onClick={() => setActiveTab('experience')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'experience'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Experience Gaps ({analysisResult.experienceGaps.length})
                </button>
              </div>

              {/* Tab Content Display */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                {activeTab === 'strong' && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-2">
                      <CheckCircle2 className="w-4 h-4" /> Strong Matches Present in Resume
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.strongMatches.map((m, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-medium">
                          ✓ {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'partial' && (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-4 h-4" /> Related Skills Needing More Depth or Evidence
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analysisResult.partialMatches.map((p, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-amber-500/20 space-y-1">
                          <span className="text-xs font-bold text-amber-300">{p.skill}</span>
                          <p className="text-[11px] text-slate-400 leading-tight">{p.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'gaps' && (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-4 h-4" /> Skills Required by Target Role Missing from Resume
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analysisResult.skillGaps.map((g, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-rose-500/20 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">{g.skill}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${g.importance === 'Required' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300'}`}>
                            {g.importance}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'keywords' && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5 mb-2">
                      <Lightbulb className="w-4 h-4" /> ATS Keywords Mentioned in Job Posting Absent in Resume
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.missingKeywords.map((kw, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-xs font-medium">
                          + {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'experience' && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5 mb-2">
                      <BarChart3 className="w-4 h-4" /> Specific Production & Experience Gaps
                    </span>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {analysisResult.experienceGaps.map((eg, idx) => (
                        <li key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                          <ChevronRight className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                          <span>{eg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: DYNAMIC SKILL GAP ACTION PLAN ("HOW TO BRIDGE YOUR GAPS") */}
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Rocket className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">How to Bridge Your Gaps</h3>
                <p className="text-xs text-slate-400">
                  Prioritized actionable roadmap & project ideas to complete and add to your resume.
                </p>
              </div>
            </div>

            {loadingPlan ? (
              <div className="flex items-center justify-center p-8 text-xs text-slate-400 gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> Generating personalized action plan...
              </div>
            ) : actionPlan && actionPlan.length > 0 ? (
              <div className="space-y-4">
                {actionPlan.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/30 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-extrabold text-slate-100">{item.skill}</span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                          item.priority === 'High'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : item.priority === 'Medium'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {item.priority} Priority
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" /> {item.estimated_effort}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{item.reason}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                          <Code2 className="w-3 h-3" /> Recommended Practical Task
                        </span>
                        <p className="text-xs text-slate-200 leading-normal">{item.action}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Concrete Project Idea
                        </span>
                        <p className="text-xs text-slate-200 leading-normal">{item.project_idea}</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                          Evidence to Add to Your Resume After Completion
                        </span>
                        <p className="text-xs font-mono text-emerald-200 mt-0.5">{item.evidence_to_add}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic text-center p-4">
                No skill gap action plan generated yet.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
