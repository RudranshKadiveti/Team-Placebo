import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { profileService, Profile } from '../services/profileService';
import { resumeService, ResumeMetadata, AtsScore } from '../services/resumeService';
import { useNavigate, Link } from 'react-router-dom';
import {
  LogOut,
  User,
  Target,
  ArrowRight,
  Compass,
  FileText,
  Settings,
  Edit3,
  Award,
  Zap,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  BarChart2,
  FileCode,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [resumes, setResumes] = useState<ResumeMetadata[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Resume Upload & ATS state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [atsScore, setAtsScore] = useState<AtsScore | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [profileData, resumeData] = await Promise.all([
          profileService.getProfile(),
          resumeService.getResumes().catch(() => ({ success: false, data: [] })),
        ]);
        setProfile(profileData.profile);
        setCompletionPercentage(profileData.completionPercentage);
        if (resumeData.success && Array.isArray(resumeData.data) && resumeData.data.length > 0) {
          setResumes(resumeData.data);
          const latestResume = resumeData.data[0];
          setSelectedResumeId(latestResume.id);
          if (latestResume.atsScore) {
            setAtsScore(latestResume.atsScore);
          } else {
            // Auto calculate ATS score for latest resume
            try {
              const scoreRes = await resumeService.scoreResume(latestResume.id);
              if (scoreRes.success && scoreRes.data) {
                setAtsScore(scoreRes.data);
              }
            } catch {
              // Fallback gracefully
            }
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 23) return 'Good evening';
    return 'Good night';
  };

  const primaryGoal =
    profile?.careerGoals && profile.careerGoals.length > 0
      ? profile.careerGoals[0].targetRole
      : 'Not set yet';

  // Resume Selection Handler
  const handleSelectResume = async (resume: ResumeMetadata) => {
    setSelectedResumeId(resume.id);
    if (resume.atsScore) {
      setAtsScore(resume.atsScore);
    } else {
      setUploading(true);
      try {
        const scoreRes = await resumeService.scoreResume(resume.id);
        if (scoreRes.success && scoreRes.data) {
          setAtsScore(scoreRes.data);
        }
      } catch {
        // Fallback gracefully
      } finally {
        setUploading(false);
      }
    }
  };

  // Resume Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processResumeFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processResumeFile(e.dataTransfer.files[0]);
    }
  };

  const processResumeFile = async (file: File) => {
    setResumeFile(file);
    setUploading(true);
    try {
      const uploadRes = await resumeService.uploadResume(file);
      const newResumeId = uploadRes.data.id;
      setSelectedResumeId(newResumeId);

      await resumeService.parseResume(newResumeId);
      const scoreRes = await resumeService.scoreResume(newResumeId);
      setAtsScore(scoreRes.data);
      
      const res = await resumeService.getResumes();
      if (res.success && Array.isArray(res.data)) {
        setResumes(res.data);
      }
    } catch {
      // Gracefully handle upload error
    } finally {
      setUploading(false);
    }
  };

  // Quick Action Navigation
  const handleQuickAction = (actionName: string, path: string) => {
    console.log(`[QuickAction] Triggered action: ${actionName} -> redirecting to ${path}`);
    navigate(path);
  };

  const activeResumeObj = resumes.find(r => r.id === selectedResumeId) || resumes[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="w-full max-w-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 md:p-10 shadow-2xl relative z-10 space-y-8">
        {/* Top Header Row with Status Badge & Sign Out */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400">
              Online
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-rose-500/10 border border-slate-700/60 hover:border-rose-500/30 text-slate-300 hover:text-rose-400 text-xs font-medium transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

        {/* Dynamic Greeting & Subtitle */}
        <header className="text-left space-y-1.5">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            {getGreeting()},{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-indigo-500 bg-clip-text text-transparent">
              {user?.name}
            </span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base font-medium">
            Let's take the next step in your career journey.
          </p>
        </header>

        {/* Main Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Career Goal Card */}
          <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                <Target className="w-4 h-4" />
              </div>
              <span>Career Goal</span>
            </div>
            <div className="text-base font-bold text-slate-100 truncate">
              {loading ? 'Loading...' : primaryGoal}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Primary Target Role</p>
          </div>

          {/* Profile Completion Card */}
          <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                <User className="w-4 h-4" />
              </div>
              <span>Profile Completion</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold text-blue-400">
                {completionPercentage}%
              </span>
              <div className="w-24 bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/50">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Calculated from completed fields</p>
          </div>
        </div>

        {/* Action Modules Banner & Buttons */}
        <section className="p-5 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/60 space-y-4 shadow-inner">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Profile optimized! Ready to explore?</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              Manage Profile & Goals <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => handleQuickAction('Explore Roles', '/profile')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold transition-all hover:border-slate-600 active:scale-95"
            >
              <Compass className="w-3.5 h-3.5 text-indigo-400" /> Explore Roles
            </button>
          </div>

          {/* 2x2 Quick Action Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleQuickAction('Edit Bio', '/profile#bio')}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 text-left text-slate-300 hover:text-white hover:border-blue-500/30 transition-all group"
            >
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20">
                <Edit3 className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium">Edit Bio</span>
            </button>

            <button
              onClick={() => handleQuickAction('Update Skills', '/profile#skills')}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 text-left text-slate-300 hover:text-white hover:border-indigo-500/30 transition-all group"
            >
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20">
                <Award className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium">Update Skills</span>
            </button>

            <button
              onClick={() => handleQuickAction('View Resume', '/profile#resume')}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 text-left text-slate-300 hover:text-white hover:border-emerald-500/30 transition-all group"
            >
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium">View Resume</span>
            </button>

            <button
              onClick={() => handleQuickAction('Settings', '/profile#settings')}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 text-left text-slate-300 hover:text-white hover:border-slate-500/30 transition-all group"
            >
              <div className="p-2 rounded-lg bg-slate-700/40 text-slate-300 group-hover:bg-slate-700">
                <Settings className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium">Settings</span>
            </button>
          </div>
        </section>

        {/* Resume Intelligence Section with Interactive Selection */}
        <section className="p-6 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-slate-100">Resume Intelligence</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {resumes.length} {resumes.length === 1 ? 'Resume' : 'Resumes'} Available
            </span>
          </div>
          {resumes.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium italic">
              No resume uploaded yet. Upload a PDF resume below to view your ATS score!
            </p>
          ) : (
            <div className="space-y-2.5">
              {resumes.map((r) => {
                const isSelected = selectedResumeId === r.id || (!selectedResumeId && resumes[0].id === r.id);
                return (
                  <div
                    key={r.id}
                    className={`flex items-center justify-between text-xs p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-blue-500/10 border-blue-500/40 text-blue-200 shadow-md shadow-blue-500/5'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold block text-slate-200 text-sm">{r.originalFileName}</span>
                        <span className="text-[11px] text-slate-500">Uploaded on {new Date(r.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectResume(r)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 cursor-default'
                          : 'bg-slate-800 hover:bg-blue-600/20 text-slate-300 hover:text-blue-400 border border-slate-700 hover:border-blue-500/30'
                      }`}
                    >
                      {isSelected ? '✓ Active / Selected' : 'Select to Analyze'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Wider Resume ATS Performance & Upload Section */}
        <section className="p-6 rounded-2xl bg-slate-800/30 border border-slate-800 hover:border-slate-700/60 hover:-translate-y-1 transition-all duration-300 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Resume ATS Performance</h3>
                <p className="text-xs text-slate-400">Real-life Applicant Tracking System analytics</p>
              </div>
            </div>
            {activeResumeObj && (
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5" /> {resumeFile ? resumeFile.name : activeResumeObj.originalFileName}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* ATS Score Circular Progress Indicator */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="relative w-24 h-24 flex items-center justify-center mb-2">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-400 transition-all duration-1000"
                    strokeDasharray={`${atsScore?.overallScore || 0}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-black text-emerald-400">
                    {uploading ? '...' : `${atsScore?.overallScore || 0}%`}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">ATS Score</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-300">
                {uploading ? 'Analyzing Resume...' : (atsScore?.overallScore || 0) >= 80 ? 'Optimal Match' : (atsScore?.overallScore || 0) > 0 ? 'Good Match' : 'Upload Resume to Score'}
              </span>
            </div>

            {/* Sub-Metrics Breakdown */}
            <div className="space-y-3 md:col-span-2">
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Semantic Context Match</span>
                <span className="text-xs font-bold text-slate-100 bg-slate-800 px-2.5 py-1 rounded-md">
                  {atsScore?.semanticMatch?.similarityPercent || 0}% match
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Formatting Check</span>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md border ${atsScore?.formattingCheck?.passed ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>
                  {atsScore?.formattingCheck?.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />} 
                  {atsScore?.formattingCheck?.passed ? 'Passed' : 'Needs Work'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Impact Readability</span>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md border ${atsScore?.readability?.status === 'Optimal' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : atsScore?.readability?.status === 'Poor' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>
                  {atsScore?.readability?.status === 'Optimal' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />} 
                  {atsScore?.readability?.status || 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* ATS Score Point Breakdown Accordion */}
          {atsScore?.pointBreakdown && (
            <div className="mt-4 space-y-2">
              <details className="group rounded-xl bg-slate-900/40 border border-slate-800 open:bg-slate-900/60 transition-colors">
                <summary className="flex items-center justify-between p-4 cursor-pointer select-none">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Section Points</span>
                    <span className="text-sm font-medium text-slate-300">Has all required sections?</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-slate-200">{atsScore.pointBreakdown.sectionPoints} <span className="text-xs text-slate-500 font-medium">/ 30</span></span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </div>
                </summary>
                <div className="px-4 pb-4 pt-1 text-xs text-slate-400 border-t border-slate-800/50 mt-2">
                  {atsScore.sectionCompleteness.missingSections.length > 0 ? (
                    <span className="text-red-400 font-medium">Lost {atsScore.pointBreakdown.lostSectionPoints} pts. Missing: {atsScore.sectionCompleteness.missingSections.join(', ')}</span>
                  ) : (
                    <span className="text-emerald-400 font-medium">Perfect! All core sections found.</span>
                  )}
                </div>
              </details>

              <details className="group rounded-xl bg-slate-900/40 border border-slate-800 open:bg-slate-900/60 transition-colors">
                <summary className="flex items-center justify-between p-4 cursor-pointer select-none">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Formatting Points</span>
                    <span className="text-sm font-medium text-slate-300">Length & readability check</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-slate-200">{atsScore.pointBreakdown.formattingPoints} <span className="text-xs text-slate-500 font-medium">/ 30</span></span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </div>
                </summary>
                <div className="px-4 pb-4 pt-1 text-xs text-slate-400 border-t border-slate-800/50 mt-2">
                  {atsScore.formattingCheck.issues.length > 0 ? (
                    <div className="text-red-400 font-medium">
                      Lost {atsScore.pointBreakdown.lostFormattingPoints} pts. Issues: 
                      <ul className="list-disc pl-4 mt-1 space-y-1">
                        {atsScore.formattingCheck.issues.map((i, idx) => <li key={idx}>{i}</li>)}
                      </ul>
                    </div>
                  ) : (
                    <span className="text-emerald-400 font-medium">Perfect! Formatting looks great.</span>
                  )}
                </div>
              </details>

              <details className="group rounded-xl bg-slate-900/40 border border-slate-800 open:bg-slate-900/60 transition-colors">
                <summary className="flex items-center justify-between p-4 cursor-pointer select-none">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Semantic Match</span>
                    <span className="text-sm font-medium text-slate-300">Contextual skill overlap</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-slate-200">{atsScore.pointBreakdown.keywordPoints} <span className="text-xs text-slate-500 font-medium">/ 40</span></span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </div>
                </summary>
                <div className="px-4 pb-4 pt-1 text-xs text-slate-400 border-t border-slate-800/50 mt-2">
                  {atsScore.pointBreakdown.lostKeywordPoints > 0 ? (
                    <span className="text-amber-400 font-medium">Lost {atsScore.pointBreakdown.lostKeywordPoints} pts. Your resume has a {atsScore.semanticMatch.similarityPercent}% contextual similarity to the ideal profile.</span>
                  ) : (
                    <span className="text-emerald-400 font-medium">Excellent semantic match!</span>
                  )}
                </div>
              </details>
            </div>
          )}

          {/* Styled Drag-and-Drop Resume Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-700/80 hover:border-blue-500/50 bg-slate-900/40 hover:bg-slate-900/80'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="p-3 rounded-full bg-blue-500/10 text-blue-400">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-200">
                {uploading ? 'Processing resume PDF & calculating ATS score...' : 'Click to upload or drag & drop new resume'}
              </p>
              <p className="text-[11px] text-slate-500">Supports PDF, DOC, DOCX (Max 10MB)</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
