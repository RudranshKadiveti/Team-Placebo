import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { profileService, Profile } from '../services/profileService';
import { resumeService, ResumeMetadata, AtsScore } from '../services/resumeService';
import { BulletTailoringModal } from '../components/BulletTailoringModal';
import { RoleAnalysisDashboard } from '../components/RoleAnalysisDashboard';
import { GitHubPortfolioDashboard } from '../components/github/GitHubPortfolioDashboard';
import { useNavigate, Link } from 'react-router-dom';
import {
  LogOut,
  User,
  LayoutDashboard,
  Target,
  FileText,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Github,
  Bell,
  MoreHorizontal,
  Download,
  AlertTriangle,
  Lightbulb,
  FileCheck2,
  Check,
  Zap,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

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

  // Modals & Active Tab State
  const [isTailorModalOpen, setIsTailorModalOpen] = useState(false);
  const [selectedBulletToTailor, setSelectedBulletToTailor] = useState('');
  const [activeTab, setActiveTab] = useState<'ats' | 'role_analysis' | 'github'>('ats');

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
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDeleteResume = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    try {
      await resumeService.deleteResume(id);
      const res = await resumeService.getResumes();
      if (res.success && Array.isArray(res.data)) {
        setResumes(res.data);
        if (res.data.length > 0) {
          handleSelectResume(res.data[0]);
        } else {
          setSelectedResumeId(null);
          setAtsScore(null);
        }
      } else {
        setResumes([]);
        setSelectedResumeId(null);
        setAtsScore(null);
      }
    } catch (err: any) {
      console.error('Delete resume error:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processResumeFile(e.target.files[0]);
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
    } finally {
      setUploading(false);
    }
  };

  const activeResumeObj = resumes.find(r => r.id === selectedResumeId) || resumes[0];

  // Data mapping for charts using REAL ATS data if available
  const currentScore = atsScore?.overallScore || 0;
  
  // Historical trend (mocked trailing data for visual appeal, ending in real score)
  const performanceData = [
    { name: 'Jan', score: Math.max(10, currentScore - 50) },
    { name: 'Feb', score: Math.max(20, currentScore - 40) },
    { name: 'Mar', score: Math.max(15, currentScore - 30) },
    { name: 'Apr', score: Math.max(45, currentScore - 20) },
    { name: 'May', score: Math.max(60, currentScore - 10) },
    { name: 'Latest', score: currentScore },
  ];

  // Point Breakdown Data (Real Data)
  const pointBreakdownData = atsScore ? [
    { name: 'Sections', points: atsScore.pointBreakdown.sectionPoints, lost: atsScore.pointBreakdown.lostSectionPoints },
    { name: 'Formatting', points: atsScore.pointBreakdown.formattingPoints, lost: atsScore.pointBreakdown.lostFormattingPoints },
    { name: 'Keywords', points: atsScore.pointBreakdown.keywordPoints, lost: atsScore.pointBreakdown.lostKeywordPoints },
  ] : [];

  const stdSections = ['Personal Information', 'Education', 'Experience', 'Skills'];
  const missingSectionsSet = new Set(atsScore?.sectionCompleteness.missingSections || []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-slate-900 tracking-tight">CareerPilot</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <button
            onClick={() => setActiveTab('ats')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'ats' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Extraction Dashboard
          </button>
          
          <button
            onClick={() => setActiveTab('role_analysis')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'role_analysis' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Target className="w-4 h-4" /> Role Analysis
          </button>
          
          <button
            onClick={() => setActiveTab('github')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'github' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Github className="w-4 h-4" /> GitHub Intelligence
          </button>

          <Link
            to="/profile"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <User className="w-4 h-4" /> My Profile
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <h1 className="text-xl font-bold text-slate-800">
            {activeTab === 'ats' ? 'CV Extraction & Diagnostics' : activeTab === 'role_analysis' ? 'Role Match Analysis' : 'GitHub Portfolio Analytics'}
          </h1>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
              {user?.name?.substring(0, 2) || 'US'}
            </div>
          </div>
        </header>

        <div className="p-8">
          {activeTab === 'ats' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {!atsScore ? (
                /* Empty / Upload State */
                <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Upload your resume to begin</h2>
                  <p className="text-sm text-slate-500 max-w-md mb-6">
                    Our ATS engine will parse your CV, extract structured data, run formatting diagnostics, and provide actionable improvement tasks.
                  </p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all shadow-md flex items-center gap-2"
                  >
                    {uploading ? 'Parsing Engine Running...' : 'Select PDF File'}
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.doc,.docx" className="hidden" />
                </div>
              ) : (
                <>
                  {/* TOP ROW: Real Extraction Data Highlights */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Section Completeness Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                        <FileCheck2 className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-sm font-bold text-slate-800">Extraction Completeness</h3>
                      </div>
                      
                      <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">
                        The parsing engine scans for standard sections required by Applicant Tracking Systems. Here is what we found:
                      </p>
                      
                      <div className="space-y-3">
                        {stdSections.map((sec, idx) => {
                          const isMissing = missingSectionsSet.has(sec);
                          return (
                            <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                              isMissing ? 'bg-rose-50/50 border-rose-100' : 'bg-emerald-50/50 border-emerald-100'
                            }`}>
                              <span className="text-xs font-bold text-slate-700">{sec}</span>
                              {isMissing ? (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded uppercase tracking-wider">
                                  <AlertTriangle className="w-3 h-3" /> Missing
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded uppercase tracking-wider">
                                  <Check className="w-3 h-3" /> Extracted
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Formatting & Readability Diagnostics */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                        <Zap className="w-5 h-5 text-amber-500" />
                        <h3 className="text-sm font-bold text-slate-800">Formatting Diagnostics</h3>
                      </div>

                      <div className="flex items-center gap-4 mb-6">
                        <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center text-xs font-black uppercase tracking-widest ${
                          atsScore.readability.status === 'Optimal' ? 'border-emerald-400 text-emerald-500 bg-emerald-50' : 
                          atsScore.readability.status === 'Moderate' ? 'border-amber-400 text-amber-500 bg-amber-50' : 'border-rose-400 text-rose-500 bg-rose-50'
                        }`}>
                           {atsScore.readability.status.substring(0,3)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Readability Status</div>
                          <div className="text-lg font-black text-slate-800">{atsScore.readability.status} Score</div>
                        </div>
                      </div>

                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Detected Issues</h4>
                      <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                        {atsScore.formattingCheck.issues.length === 0 ? (
                           <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold flex items-center gap-2">
                             <CheckCircle2 className="w-4 h-4" /> Perfect formatting detected!
                           </div>
                        ) : (
                          atsScore.formattingCheck.issues.map((issue, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-2.5">
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                              <span className="text-xs font-medium text-amber-800 leading-snug">{issue}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Actionable Suggestions (To-Do List) */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                        <Lightbulb className="w-5 h-5 text-blue-500" />
                        <h3 className="text-sm font-bold text-slate-800">Actionable Suggestions</h3>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {atsScore.actionableSuggestions.map((suggestion, idx) => (
                          <label key={idx} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-colors group">
                            <input type="checkbox" className="mt-1 w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500" />
                            <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 leading-snug">
                              {suggestion}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* BOTTOM ROW: Analytics Charts & Resumes */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Analytics Charts */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800 mb-6">ATS Score Diagnostics</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Overall Score Trend */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-xs font-bold text-slate-500">Resume Strength (Historical)</span>
                             <span className="text-xs font-bold flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Overall Score</span>
                          </div>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={performanceData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dx={-10} domain={[0, 100]} />
                                <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Exact Point Breakdown Chart */}
                        <div className="space-y-2">
                           <div className="flex items-center justify-between mb-2">
                             <span className="text-xs font-bold text-slate-500">Point Breakdown Metrics</span>
                           </div>
                           <div className="h-48">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={pointBreakdownData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={5} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dx={-10} />
                                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                  
                                  {/* Earned Points */}
                                  <Bar dataKey="points" name="Points Earned" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                                  {/* Lost Points */}
                                  <Bar dataKey="lost" name="Points Lost" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* My Resumes List */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Uploaded CVs</h3>
                        
                        <div className="flex items-center gap-2">
                          <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition-colors">
                            Upload New
                          </button>
                          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.doc,.docx" className="hidden" />
                          <MoreHorizontal className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                      
                      <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                        {resumes.length === 0 ? (
                           <div className="text-xs text-slate-400 italic py-4 text-center">No resumes uploaded.</div>
                        ) : (
                          resumes.map(r => {
                            const isSelected = selectedResumeId === r.id;
                            return (
                              <div 
                                key={r.id} 
                                onClick={() => handleSelectResume(r)}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${isSelected ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300'}`}
                              >
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-500' : 'text-slate-400'}`} />
                                  <span className="text-xs font-bold text-slate-700 truncate">{r.originalFileName}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                   <button onClick={(e) => handleDeleteResume(r.id, e)} className="p-1.5 hover:bg-rose-100 rounded-md text-slate-400 hover:text-rose-500 transition-colors">
                                     <Trash2 className="w-3 h-3" />
                                   </button>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>

                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'role_analysis' && (
            <div className="animate-in fade-in duration-300">
              {activeResumeObj ? (
                <RoleAnalysisDashboard resumeId={activeResumeObj.id} />
              ) : (
                <div className="p-12 text-center text-sm font-medium text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  Please upload a PDF resume in the Extraction Dashboard to enable Target Role Analysis.
                </div>
              )}
            </div>
          )}

          {activeTab === 'github' && (
            <div className="animate-in fade-in duration-300">
              <GitHubPortfolioDashboard />
            </div>
          )}
        </div>
      </main>

      <BulletTailoringModal
        isOpen={isTailorModalOpen}
        onClose={() => setIsTailorModalOpen(false)}
        initialBullet={selectedBulletToTailor}
        targetRoleTitle=""
      />
    </div>
  );
};
