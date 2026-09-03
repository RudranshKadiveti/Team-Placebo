import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Search, Briefcase, MapPin, DollarSign, ExternalLink, ArrowRight, Save, Clock, Loader2, Sparkles, Map } from 'lucide-react';
import { careerService, JobListing, CareerRoadmap } from '../services/careerService';

export const CareerPathDashboard: React.FC = () => {
  const [targetRole, setTargetRole] = useState('');
  const [region, setRegion] = useState('Worldwide');
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [savedRoadmaps, setSavedRoadmaps] = useState<CareerRoadmap[]>([]);
  
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeRoadmap, setActiveRoadmap] = useState<CareerRoadmap | null>(null);
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
    setActiveJobId(null);

    try {
      const results = await careerService.searchJobs(targetRole, region);
      setJobs(results);
      if (results.length === 0) {
        setError(`No jobs found for "${targetRole}". Try a different title.`);
      }
    } catch (err: any) {
      setError('Failed to search jobs. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateRoadmap = async (job: JobListing) => {
    setIsGenerating(true);
    setError(null);
    setActiveJobId(job.id);
    setActiveRoadmap(null);

    try {
      const roadmap = await careerService.generateRoadmap(
        targetRole,
        job.title,
        job.description,
        job.company,
        job.url
      );
      setActiveRoadmap(roadmap);
      loadSavedRoadmaps(); // refresh saved list
    } catch (err: any) {
      setError('Failed to generate roadmap. Please ensure your Resume and GitHub are connected.');
      setActiveJobId(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const viewSavedRoadmap = (roadmap: CareerRoadmap) => {
    setActiveRoadmap(roadmap);
    setTargetRole(roadmap.targetRole);
    // Clear jobs view so they focus on the roadmap
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
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Career Path & Roadmap</h2>
          </div>
          <p className="text-sm font-medium text-slate-500 max-w-lg">
            Enter your target role. We'll find real remote job openings and use your connected GitHub & Resume data to generate a personalized AI roadmap to bridge your skill gap.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col md:flex-row w-full lg:w-auto gap-3">
          <div className="relative flex-1 md:w-64 lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              list="role-suggestions"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior React Developer"
              required
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all shadow-sm"
            />
            <datalist id="role-suggestions">
              <option value="Frontend Developer" />
              <option value="Frontend React Developer" />
              <option value="Backend Developer" />
              <option value="Backend Node.js Engineer" />
              <option value="Full Stack Developer" />
              <option value="Software Engineer" />
              <option value="DevOps Engineer" />
              <option value="Data Scientist" />
              <option value="Data Engineer" />
              <option value="Machine Learning Engineer" />
              <option value="Product Manager" />
              <option value="UI/UX Designer" />
              <option value="Mobile Developer" />
              <option value="Cybersecurity Analyst" />
              <option value="Cloud Architect" />
            </datalist>
          </div>
          
          <div className="relative flex-1 md:w-48">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all shadow-sm appearance-none"
            >
              <option value="Worldwide">Worldwide (Anywhere)</option>
              <option value="India">India</option>
              <option value="USA">USA</option>
              <option value="North America">North America</option>
              <option value="Europe">Europe</option>
              <option value="UK">United Kingdom</option>
              <option value="Canada">Canada</option>
              <option value="LATAM">Latin America</option>
              <option value="Asia">Asia</option>
              <option value="Oceania">Oceania</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-slate-900/20 disabled:opacity-70 shrink-0"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
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
                <Briefcase className="w-4 h-4 text-indigo-500" /> Real-time Job Matches
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map(job => (
                  <div key={job.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 transition-all shadow-sm group flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {job.source}
                        </span>
                        <a href={job.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-500 p-1 bg-slate-50 rounded-lg">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
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
                      onClick={() => handleGenerateRoadmap(job)}
                      disabled={isGenerating && activeJobId !== job.id}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        activeJobId === job.id
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      {activeJobId === job.id && isGenerating ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Generating AI Roadmap...</>
                      ) : (
                        <><Sparkles className="w-4 h-4 text-amber-500" /> Generate Roadmap</>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVE ROADMAP VIEW */}
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
                    <Save className="w-3.5 h-3.5" /> Automatically Saved
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
                Enter a role above to fetch remote jobs and generate your personalized learning path.
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
    </div>
  );
};
