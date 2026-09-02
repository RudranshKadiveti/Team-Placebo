import React, { useState } from 'react';
import { RoleAnalysisResult, ActionPlanItem, resumeService } from '../services/resumeService';
import { Target, Search, CheckCircle2, AlertTriangle, Clock, Code2, RefreshCw, Rocket, Zap } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

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

  const radarData = analysisResult ? [
    { subject: 'Skills', A: analysisResult.scoreBreakdown.skillsMatch, fullMark: 100 },
    { subject: 'Keywords', A: analysisResult.scoreBreakdown.keywordMatch, fullMark: 100 },
    { subject: 'Experience', A: analysisResult.scoreBreakdown.experienceMatch, fullMark: 100 },
    { subject: 'Tech Stack', A: analysisResult.scoreBreakdown.technicalStackMatch, fullMark: 100 },
    { subject: 'Projects', A: analysisResult.scoreBreakdown.projectRelevance, fullMark: 100 },
    { subject: 'Overall Match', A: analysisResult.overallMatchScore, fullMark: 100 },
  ] : [];

  return (
    <div className="space-y-6">
      {/* SECTION 1: TARGET ROLE INPUT */}
      <section className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 rounded-xl bg-pink-50 text-pink-500 border border-pink-100">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Target Role Analysis</h2>
            <p className="text-xs text-slate-500">
              Compare your resume against a target job title or complete job description.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Job Title (Optional if JD provided)
            </label>
            <input
              type="text"
              value={targetTitle}
              onChange={(e) => setTargetTitle(e.target.value)}
              placeholder="e.g. Senior Backend Engineer / Full-Stack Developer"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Complete Job Description (Primary Source for Keyword Extraction)
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste full job description text here (requirements, responsibilities, tech stack)..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-50"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || (!targetTitle.trim() && !jobDescription.trim())}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold text-xs transition-all shadow-md shadow-pink-500/20 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Analyzing Resume Against Target Role...' : 'Analyze Target Role Match'}
          </button>
        </div>
      </section>

      {/* SECTION 2: MATCH SCORE & CATEGORIZATION DASHBOARD */}
      {analysisResult && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          
          {/* LEFT PANEL: Radar Chart & Sub-metrics (Matches Image 1 layout) */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col space-y-6">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Your personal report</h2>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600">Profile</p>
                <p className="text-base font-bold text-slate-800">{analysisResult.targetRoleTitle || 'Candidate'}</p>
              </div>
              
              {/* Circular Score Match (Pink/Purple) */}
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-100" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path
                    className="text-[#b72c72] transition-all duration-1000"
                    strokeDasharray={`${analysisResult.overallMatchScore}, 100`}
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center mt-1">
                  <span className="text-xl font-black text-slate-800 leading-none">{analysisResult.overallMatchScore}%</span>
                  <span className="text-[7px] text-slate-400 font-bold tracking-widest mt-0.5">MATCH</span>
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-slate-100"></div>

            {/* Radar Chart for Competencies */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">Key Competencies</h3>
              <div className="h-56 w-full -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} />
                    <Radar name="Match" dataKey="A" stroke="#b72c72" fill="#d84c95" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Progress Bars for Directions */}
            <div className="space-y-4 flex-1 pt-2">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Rating by Categories</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-32 text-xs font-semibold text-slate-600 truncate">Skills & Core</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#9f1b5b] rounded-full" style={{ width: `${analysisResult.scoreBreakdown.skillsMatch}%` }}></div>
                  </div>
                  <span className="w-8 text-xs font-bold text-slate-800 text-right">{analysisResult.scoreBreakdown.skillsMatch}%</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="w-32 text-xs font-semibold text-slate-600 truncate">Keywords Match</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#b72c72] rounded-full" style={{ width: `${analysisResult.scoreBreakdown.keywordMatch}%` }}></div>
                  </div>
                  <span className="w-8 text-xs font-bold text-slate-800 text-right">{analysisResult.scoreBreakdown.keywordMatch}%</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-32 text-xs font-semibold text-slate-600 truncate">Experience Level</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#a356db] rounded-full" style={{ width: `${analysisResult.scoreBreakdown.experienceMatch}%` }}></div>
                  </div>
                  <span className="w-8 text-xs font-bold text-slate-800 text-right">{analysisResult.scoreBreakdown.experienceMatch}%</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-32 text-xs font-semibold text-slate-600 truncate">Tech & Projects</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#5b73e8] rounded-full" style={{ width: `${Math.round((analysisResult.scoreBreakdown.technicalStackMatch + analysisResult.scoreBreakdown.projectRelevance) / 2)}%` }}></div>
                  </div>
                  <span className="w-8 text-xs font-bold text-slate-800 text-right">{Math.round((analysisResult.scoreBreakdown.technicalStackMatch + analysisResult.scoreBreakdown.projectRelevance) / 2)}%</span>
                </div>
              </div>
            </div>

            {/* Summary Blocks */}
            <div className="grid grid-cols-3 gap-3 pt-4">
              <div className="bg-pink-50 rounded-xl p-3 text-center">
                <span className="block text-xl font-black text-[#b72c72]">{analysisResult.skillGaps.length}</span>
                <span className="text-[9px] text-pink-600 font-bold uppercase">Gaps</span>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <span className="block text-xl font-black text-[#8534b8]">{analysisResult.strongMatches.length}</span>
                <span className="text-[9px] text-purple-600 font-bold uppercase">Matches</span>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <span className="block text-xl font-black text-emerald-600">{analysisResult.missingKeywords.length}</span>
                <span className="text-[9px] text-emerald-600 font-bold uppercase">Keywords</span>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Details & Action Plan */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Findings Categorization Tabs */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
                <button
                  onClick={() => setActiveTab('gaps')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'gaps' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  Skill Gaps ({analysisResult.skillGaps.length})
                </button>
                <button
                  onClick={() => setActiveTab('strong')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'strong' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  Strong Matches ({analysisResult.strongMatches.length})
                </button>
                <button
                  onClick={() => setActiveTab('partial')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'partial' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  Partial Matches ({analysisResult.partialMatches.length})
                </button>
              </div>

              {/* Tab Content Display */}
              <div className="min-h-[200px]">
                {activeTab === 'strong' && (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 mb-2">
                      <CheckCircle2 className="w-4 h-4" /> Strong Matches Present in Resume
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.strongMatches.map((m, idx) => (
                        <span key={idx} className="px-3 py-1.5 rounded-xl bg-white text-slate-700 border border-slate-200 shadow-sm text-xs font-bold">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'partial' && (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-amber-600 flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-4 h-4" /> Related Skills Needing More Depth or Evidence
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {analysisResult.partialMatches.map((p, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
                          <span className="text-xs font-bold text-slate-800">{p.skill}</span>
                          <p className="text-[11px] text-slate-500 leading-tight">{p.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'gaps' && (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-rose-600 flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-4 h-4" /> Skills Required by Target Role Missing from Resume
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {analysisResult.skillGaps.map((g, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800 leading-tight">{g.skill}</span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${g.importance === 'Required' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                            {g.importance}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ACTION PLAN */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-500 border border-emerald-100">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Bridging the Gap</h3>
                  <p className="text-xs text-slate-500">
                    Prioritized actionable roadmap & project ideas to complete.
                  </p>
                </div>
              </div>

              {loadingPlan ? (
                <div className="flex items-center justify-center p-8 text-xs text-slate-500 gap-2 font-medium">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" /> Generating personalized action plan...
                </div>
              ) : actionPlan && actionPlan.length > 0 ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {actionPlan.map((item, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-extrabold text-slate-800">{item.skill}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            item.priority === 'High' ? 'bg-rose-100 text-rose-600' : item.priority === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {item.priority} Priority
                          </span>
                        </div>
                        <span className="text-[11px] font-mono font-semibold text-slate-500 flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200">
                          <Clock className="w-3 h-3 text-slate-400" /> {item.estimated_effort}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{item.reason}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-sm">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                            <Code2 className="w-3 h-3" /> Recommended Task
                          </span>
                          <p className="text-xs text-slate-700 leading-normal font-medium">{item.action}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-sm">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Project Idea
                          </span>
                          <p className="text-xs text-slate-700 leading-normal font-medium">{item.project_idea}</p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-2.5 mt-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                            Evidence to Add to Resume
                          </span>
                          <p className="text-xs font-mono font-semibold text-emerald-800 mt-0.5">{item.evidence_to_add}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-medium italic text-center p-4">
                  No skill gap action plan generated yet.
                </p>
              )}
            </div>

          </div>
        </section>
      )}
    </div>
  );
};
