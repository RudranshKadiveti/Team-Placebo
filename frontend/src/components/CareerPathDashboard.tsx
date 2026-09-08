import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Search, Briefcase, MapPin, DollarSign, ExternalLink, ArrowRight, Save, Clock, Loader2, Sparkles, Map } from 'lucide-react';
import { careerService, JobListing, CareerRoadmapRecord } from '../services/careerService';
import { RoadmapModal } from './roadmap/RoadmapModal';

interface CareerPathDashboardProps {
  onNavigateToTab?: (tab: string) => void;
}

export const CareerPathDashboard: React.FC<CareerPathDashboardProps> = ({ onNavigateToTab }) => {
  const [targetRole, setTargetRole] = useState('');
  const [region, setRegion] = useState('Worldwide');
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [savedRoadmaps, setSavedRoadmaps] = useState<CareerRoadmapRecord[]>([]);
  
  const [isSearching, setIsSearching] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [activeRoadmap, setActiveRoadmap] = useState<CareerRoadmapRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSavedRoadmaps();
  }, []);

  const loadSavedRoadmaps = async () => {
    try {
      const roadmaps = await careerService.getSavedRoadmaps();
      setSavedRoadmaps(roadmaps);
    } catch (err) {
      console.error('Failed to load saved roadmaps', err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole.trim()) return;

    setIsSearching(true);
    setError(null);
    setJobs([]);
    setActiveRoadmap(null);

    try {
      const results = await careerService.searchJobs(targetRole, region);
      setJobs(results);
      if (results.length === 0) {
        setError(`No jobs found for "${targetRole}". Try a different title.`);
      }
    } catch (err: any) {
      setError('Failed to search jobs. Please try again.');
    } fontally: {
      setIsSearching(false);
    }
  };

  const handleOpenRoadmapModal = (job: JobListing) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const viewSavedRoadmap = (roadmap: CareerRoadmapRecord) => {
    setActiveRoadmap(roadmap);
    setTargetRole(roadmap.targetRole);
    setJobs([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER & SEARCH */}
      <section className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="flex-1 w-full">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
              <Map className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Career Path & AI Roadmap</h2>
          </div>
          <p className="text-sm font-medium text-slate-500 max-w-lg">
            Search for job opportunities and generate a personalized AI learning path comparing your verified resume & GitHub skills against the job requirements.
          </p>
        </div>

        <form onSubmit={handleSearch} className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. Full Stack Engineer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
            />
          </div>

          <div className="relative sm:w-40">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50 appearance-none cursor-pointer"
            >
              <option value="Worldwide">Worldwide</option>
              <option value="India">India</option>
              <option value="USA">USA</option>
              <option value="Europe">Europe</option>
              <option value="LATAM">Latin America</option>
              <option value="Asia">Asia</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-slate-900/20 disabled:opacity-70 shrink-0"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search Jobs'}
          </button>
        </form>
      </section>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-semibold text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT/MAIN COLUMN: JOB RESULTS OR ACTIVE ROADMAP */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* JOB RESULTS GRID */}
          {jobs.length > 0 && !activeRoadmap && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Briefcase className="w-4 h-4 text-indigo-500" /> Real-time Job Matches ({jobs.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map(job => (
                  <div key={job.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 transition-all shadow-sm group flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {job.source}
                        </span>
                        {job.url && job.url.startsWith('http') && (
                          <a href={job.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-500 p-1 bg-slate-50 rounded-lg">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-slate-800 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
                        {job.title}
                      </h4>
                      <p className="text-sm font-semibold text-slate-500 mb-3">{job.company}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                          <MapPin className="w-3 h-3 text-slate-400" /> {job.location}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                          <DollarSign className="w-3 h-3 text-slate-400" /> {job.salary}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenRoadmapModal(job)}
                      className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-100 shadow-sm"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" /> Generate AI Roadmap
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVE ROADMAP VIEW FOR SAVED ROADMAPS */}
          {activeRoadmap && (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              
              <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Career Roadmap</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                      Target: {activeRoadmap.targetRole}
                    </span>
                    {activeRoadmap.targetCompany && (
                      <span className="text-sm font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                        @ {activeRoadmap.targetCompany}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 inline-flex items-center gap-1.5 shadow-sm">
                    <Save className="w-3.5 h-3.5" /> Saved
                  </span>
                </div>
              </div>

              <div className="prose prose-slate prose-sm sm:prose-base max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-a:text-indigo-600 hover:prose-a:text-indigo-500 marker:text-indigo-500">
                <ReactMarkdown>{activeRoadmap.roadmapContent}</ReactMarkdown>
              </div>
            </div>
          )}

          {!activeRoadmap && jobs.length === 0 && !isSearching && (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-3xl border border-slate-200 border-dashed">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-4">
                <Map className="w-8 h-8 text-indigo-300" />
              </div>
              <h4 className="text-slate-700 font-bold mb-1">No Active Search</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Enter a target role above to fetch remote jobs and compare your profile skills.
              </p>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: SAVED ROADMAPS SIDEBAR */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Save className="w-4 h-4 text-slate-400" /> Saved Roadmaps
          </h3>
          
          <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm flex flex-col gap-2 max-h-[600px] overflow-y-auto">
            {savedRoadmaps.length === 0 ? (
              <div className="p-6 text-center text-xs font-medium text-slate-500">
                You haven't saved any roadmaps yet.
              </div>
            ) : (
              savedRoadmaps.map(rm => (
                <button
                  key={rm.id}
                  onClick={() => viewSavedRoadmap(rm)}
                  className={`w-full text-left p-4 rounded-xl transition-all border flex flex-col gap-2 group ${
                    activeRoadmap?.id === rm.id
                      ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                      : 'bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <h4 className={`text-sm font-bold line-clamp-1 ${activeRoadmap?.id === rm.id ? 'text-indigo-700' : 'text-slate-800 group-hover:text-indigo-600'}`}>
                    {rm.targetRole}
                  </h4>
                  {rm.targetCompany && (
                    <span className="text-xs font-semibold text-slate-500">
                      {rm.targetCompany}
                    </span>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                      <Clock className="w-3 h-3" />
                      {new Date(rm.createdAt).toLocaleDateString()}
                    </span>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${activeRoadmap?.id === rm.id ? 'text-indigo-500 translate-x-1' : 'text-slate-300 group-hover:text-indigo-400'}`} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ROADMAP MODAL */}
      <RoadmapModal
        job={selectedJob}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          loadSavedRoadmaps();
        }}
        onNavigateToProfile={onNavigateToTab}
      />

    </div>
  );
};
