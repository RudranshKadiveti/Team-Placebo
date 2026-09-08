import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  BookOpen,
  ArrowRight,
  Upload,
  Github,
  Award,
  Layers,
  HelpCircle,
  Code,
  Target,
  Zap,
  TrendingUp
} from 'lucide-react';
import {
  JobListing,
  GeneratedRoadmap,
  RoadmapResponse,
  careerService
} from '../../services/careerService';

interface RoadmapModalProps {
  job: JobListing | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToProfile?: (tab: string) => void;
}

const LOADING_STEPS = [
  'Extracting job-specific requirements & technical expectations...',
  'Parsing candidate profile (Resume & GitHub repos)...',
  'Executing deterministic skill overlap & gap analysis...',
  'Generating job-tailored learning milestones, projects & resource guides...'
];

export const RoadmapModal: React.FC<RoadmapModalProps> = ({
  job,
  isOpen,
  onClose,
  onNavigateToProfile
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [roadmap, setRoadmap] = useState<GeneratedRoadmap | null>(null);
  const [missingProfile, setMissingProfile] = useState<RoadmapResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && job) {
      fetchRoadmap(job, false);
    } else {
      setRoadmap(null);
      setError(null);
      setMissingProfile(null);
    }
  }, [isOpen, job]);

  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 1600);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const fetchRoadmap = async (targetJob: JobListing, forceRegenerate: boolean = false) => {
    setLoading(true);
    setError(null);
    setMissingProfile(null);

    try {
      const response = await careerService.generateRoadmap(targetJob, forceRegenerate);
      
      if (response.missingProfileData) {
        setMissingProfile(response);
        setRoadmap(null);
      } else if (response.roadmap) {
        setRoadmap(response.roadmap);
      } else {
        setError(response.message || 'We could not generate your roadmap right now. Please try again.');
      }
    } catch (err: any) {
      console.error('Roadmap fetch error:', err);
      setError('We could not generate your roadmap right now. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-50 text-slate-800 min-h-full border-l border-slate-200 shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* MODAL HEADER */}
        <header className="p-6 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-sm">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">AI Learning Roadmap</span>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">{job.company}</span>
              </div>
              <h2 className="text-lg font-black text-slate-800 mt-0.5">{job.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {roadmap && !loading && (
              <button
                onClick={() => fetchRoadmap(job, true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all border border-slate-200 shadow-sm"
                title="Regenerate Roadmap"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                Regenerate
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* MODAL BODY CONTENT */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto space-y-8">

          {/* LOADING STATE */}
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-300">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-md">
                  <Sparkles className="w-10 h-10 animate-spin text-amber-500" style={{ animationDuration: '4s' }} />
                </div>
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="text-lg font-bold text-slate-800">Analyzing Job Description</h3>
                <p className="text-sm text-indigo-600 font-semibold transition-all duration-300">
                  {LOADING_STEPS[loadingStepIndex]}
                </p>
              </div>
              <div className="w-64 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                  style={{ width: `${((loadingStepIndex + 1) / LOADING_STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* MISSING PROFILE ALERT */}
          {!loading && missingProfile && (
            <div className="p-8 rounded-3xl bg-amber-50 border border-amber-200 text-slate-800 space-y-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-amber-100 text-amber-600 border border-amber-200 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-amber-900 mb-1">Profile Data Needed</h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {missingProfile.message || 'Please upload your resume or connect your GitHub profile so our AI engine can compare your verified skills against job requirements.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                {missingProfile.missingResume && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToProfile?.('resume');
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all shadow-md"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Resume
                  </button>
                )}
                {missingProfile.missingGithub && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToProfile?.('skills');
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm transition-all border border-slate-300 shadow-sm"
                  >
                    <Github className="w-4 h-4 text-purple-600" />
                    Connect GitHub
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {!loading && error && (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center gap-3 shadow-sm font-semibold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
              <p>{error}</p>
            </div>
          )}

          {/* ROADMAP PRESENTATION */}
          {!loading && roadmap && (
            <>
              {/* READINESS HEADER */}
              <section className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    <Award className="w-4 h-4" />
                    Evidence-Based Job Match Score
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                    {roadmap.jobAnalysis.readinessPercentage}% Readiness for {job.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {roadmap.jobAnalysis.summary}
                  </p>

                  {/* KEY STRENGTHS */}
                  {roadmap.jobAnalysis.keyStrengths && roadmap.jobAnalysis.keyStrengths.length > 0 && (
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-500 font-bold">Key Strengths:</span>
                      {roadmap.jobAnalysis.keyStrengths.map((str, i) => (
                        <span key={i} className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                          ✓ {str}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* READINESS SCORE CARD */}
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="text-4xl font-black text-emerald-600">
                    {roadmap.jobAnalysis.readinessPercentage}%
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    Target Time: <span className="text-slate-800 font-bold">{roadmap.finalAssessment?.estimatedTimeToBecomeCompetitive || '3-5 weeks'}</span>
                  </div>
                </div>
              </section>

              {/* "WHY THIS ROADMAP?" TRANSPARENT EXPLANATION */}
              {roadmap.jobAnalysis.whyThisRoadmap && (
                <section className="p-6 rounded-3xl bg-indigo-50/70 border border-indigo-100 text-slate-800 space-y-2 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
                    <HelpCircle className="w-4 h-4 text-indigo-600" />
                    Why This Roadmap? (Transparent Personalization)
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    {roadmap.jobAnalysis.whyThisRoadmap}
                  </p>
                </section>
              )}

              {/* MATCHED SKILLS */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <h4 className="text-base font-bold text-slate-800">Matched Skills ({roadmap.matchedSkills.length})</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {roadmap.matchedSkills.map((match, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-sm flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800 text-sm">{match.skill}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase">
                          {match.confidence}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium line-clamp-1">{match.evidence}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* SKILL GAPS WITH JOB EVIDENCE */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-500" />
                  <h4 className="text-base font-bold text-slate-800">Specific Job Skill Gaps ({roadmap.skillGaps.length})</h4>
                </div>

                <div className="space-y-3">
                  {roadmap.skillGaps.map((gap, i) => {
                    const priorityColor =
                      gap.priority === 'high'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : gap.priority === 'medium'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200';

                    return (
                      <div
                        key={i}
                        className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">{gap.skill}</span>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                              Level: {gap.currentLevel || 'none'} → {gap.targetLevel || 'intermediate'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium">{gap.reason}</p>
                          {gap.jobEvidence && (
                            <p className="text-[11px] text-indigo-600 font-semibold italic">
                              Job Evidence: "{gap.jobEvidence}"
                            </p>
                          )}
                        </div>

                        <span className={`self-start sm:self-center text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-xl border ${priorityColor}`}>
                          {gap.priority} Priority
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* LEARNING PATH TIMELINE WITH JOB-SPECIFIC PROJECTS */}
              <section className="space-y-6 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                    <h4 className="text-base font-bold text-slate-800">Job-Tailored Learning Path</h4>
                  </div>
                  <span className="text-xs text-slate-500 font-bold">{roadmap.learningPath.length} Milestones</span>
                </div>

                <div className="space-y-6 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
                  {roadmap.learningPath.map((milestone, idx) => (
                    <div key={idx} className="relative pl-14 group">
                      <div className="absolute left-0 top-0 w-12 h-12 rounded-2xl bg-slate-900 group-hover:bg-indigo-600 text-white font-black text-sm flex items-center justify-center transition-all shadow-md">
                        {String(milestone.order).padStart(2, '0')}
                      </div>

                      <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-indigo-300 transition-all shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <h5 className="font-bold text-slate-800 text-base mb-0.5">{milestone.title}</h5>
                            <p className="text-xs text-indigo-600 font-bold">{milestone.reason}</p>
                          </div>
                          <span className="text-xs px-3 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 font-bold shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-indigo-500" />
                            {milestone.estimatedTime}
                          </span>
                        </div>

                        {/* TOPICS & SKILLS */}
                        {milestone.topics && milestone.topics.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-bold text-slate-400">Key Focus Topics:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {milestone.topics.map((t, ti) => (
                                <span key={ti} className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 font-medium">
                                  • {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* JOB-SPECIFIC CAPSTONE PROJECT */}
                        {milestone.project && (
                          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                              <Code className="w-3.5 h-3.5 text-indigo-600" />
                              Job-Tailored Hands-on Project:
                            </div>
                            <p className="text-xs text-slate-700 font-semibold">{milestone.project}</p>
                          </div>
                        )}

                        {/* RESOURCES */}
                        {milestone.resources && milestone.resources.length > 0 && (
                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-xs font-bold text-slate-400 block mb-2">Authoritative Learning Resources:</span>
                            <div className="flex flex-wrap gap-2">
                              {milestone.resources.map((res, ri) => (
                                <a
                                  key={ri}
                                  href={res.url && res.url.startsWith('http') ? res.url : 'https://developer.mozilla.org'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 transition-all font-semibold"
                                >
                                  <span>{res.title}</span>
                                  <ExternalLink className="w-3 h-3 text-slate-400" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* FINAL ASSESSMENT BOX */}
              {roadmap.finalAssessment && (
                <section className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <Target className="w-4 h-4 text-emerald-600" />
                    Final Executive Assessment
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Primary Technical Gap</span>
                      <span className="text-rose-600 font-bold text-sm">{roadmap.finalAssessment.biggestGap}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Most Important Next Step</span>
                      <span className="text-indigo-600 font-bold text-sm">{roadmap.finalAssessment.mostImportantNextStep}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Time to Job Competitive</span>
                      <span className="text-emerald-600 font-bold text-sm">{roadmap.finalAssessment.estimatedTimeToBecomeCompetitive}</span>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};
