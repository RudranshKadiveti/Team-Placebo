import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { profileService, Profile, CareerGoal, ExperienceLevel } from '../services/profileService';
import {
  User,
  Briefcase,
  GraduationCap,
  MapPin,
  Phone,
  BookOpen,
  Calendar,
  Award,
  Save,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Target,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'ENTRY_LEVEL', label: 'Entry Level (0-1 yrs)' },
  { value: 'JUNIOR', label: 'Junior (1-3 yrs)' },
  { value: 'MID_LEVEL', label: 'Mid Level (3-5 yrs)' },
  { value: 'SENIOR', label: 'Senior (5+ yrs)' },
];

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  // Profile Form State
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [university, setUniversity] = useState('');
  const [degree, setDegree] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [graduationYear, setGraduationYear] = useState<number | ''>('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | ''>('');
  const [bio, setBio] = useState('');

  // Career Goals State
  const [careerGoals, setCareerGoals] = useState<CareerGoal[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);

  // Goal Form Modal / Inline State
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const [priority, setPriority] = useState<number>(1);

  // Status & Feedback
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const data = await profileService.getProfile();
      if (data.profile) {
        setPhone(data.profile.phone || '');
        setLocation(data.profile.location || '');
        setUniversity(data.profile.university || '');
        setDegree(data.profile.degree || '');
        setFieldOfStudy(data.profile.fieldOfStudy || '');
        setGraduationYear(data.profile.graduationYear || '');
        setExperienceLevel(data.profile.experienceLevel || '');
        setBio(data.profile.bio || '');
        setCareerGoals(data.profile.careerGoals || []);
      }
      setCompletionPercentage(data.completionPercentage || 0);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load profile data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setMessage(null);

    try {
      const payload: Partial<Profile> = {
        phone: phone || null,
        location: location || null,
        university: university || null,
        degree: degree || null,
        fieldOfStudy: fieldOfStudy || null,
        graduationYear: graduationYear ? Number(graduationYear) : null,
        experienceLevel: experienceLevel ? (experienceLevel as ExperienceLevel) : null,
        bio: bio || null,
      };

      const result = await profileService.updateProfile(payload);
      setCompletionPercentage(result.completionPercentage);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: unknown) {
      const apiError = (err as { response?: { data?: { error?: { message?: string } } } })
        .response?.data?.error?.message;
      setMessage({ type: 'error', text: apiError || 'Failed to update profile' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleOpenGoalForm = (goal?: CareerGoal) => {
    if (goal) {
      setEditingGoalId(goal.id);
      setTargetRole(goal.targetRole);
      setTargetIndustry(goal.targetIndustry || '');
      setTargetLocation(goal.targetLocation || '');
      setPriority(goal.priority);
    } else {
      setEditingGoalId(null);
      setTargetRole('');
      setTargetIndustry('');
      setTargetLocation('');
      setPriority(careerGoals.length + 1);
    }
    setShowGoalForm(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole.trim()) return;

    setSavingGoal(true);
    try {
      if (editingGoalId) {
        await profileService.updateCareerGoal(editingGoalId, {
          targetRole: targetRole.trim(),
          targetIndustry: targetIndustry.trim() || undefined,
          targetLocation: targetLocation.trim() || undefined,
          priority: Number(priority),
        });
      } else {
        await profileService.createCareerGoal({
          targetRole: targetRole.trim(),
          targetIndustry: targetIndustry.trim() || undefined,
          targetLocation: targetLocation.trim() || undefined,
          priority: Number(priority),
        });
      }
      setShowGoalForm(false);
      await loadProfileData();
      setMessage({ type: 'success', text: editingGoalId ? 'Career goal updated' : 'Career goal added' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save career goal' });
    } finally {
      setSavingGoal(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this career goal?')) return;
    try {
      await profileService.deleteCareerGoal(id);
      await loadProfileData();
      setMessage({ type: 'success', text: 'Career goal deleted' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete career goal' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans p-6 md:p-12 relative overflow-hidden">
      
      {/* Background soft glow matching light theme */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-100/50 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 font-semibold transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <User className="w-8 h-8 text-blue-500" /> User Profile
            </h1>
          </div>

          {/* Profile Completion Indicator */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shrink-0 shadow-sm">
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-2">
                <span>Profile Completion</span>
                <span className="text-blue-600 font-bold">{completionPercentage}%</span>
              </div>
              <div className="w-48 bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl border text-sm flex items-center gap-3 shadow-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-rose-50 border-rose-200 text-rose-600'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">
            <User className="w-5 h-5 text-blue-500" /> Personal & Educational Details
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Full Name (Account)
              </label>
              <input
                type="text"
                value={user?.name || ''}
                disabled
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-500 cursor-not-allowed outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Email Address (Account)
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-500 cursor-not-allowed outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-700 placeholder-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="San Francisco, CA"
                  className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-700 placeholder-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                University / Institution
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Stanford University"
                  className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-700 placeholder-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Degree
              </label>
              <div className="relative">
                <Award className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="Bachelor of Science"
                  className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-700 placeholder-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Field of Study
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={fieldOfStudy}
                  onChange={(e) => setFieldOfStudy(e.target.value)}
                  placeholder="Computer Science & AI"
                  className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-700 placeholder-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Graduation Year
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value ? parseInt(e.target.value, 10) : '')}
                  placeholder="2025"
                  min="1950"
                  max="2100"
                  className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-700 placeholder-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Experience Level
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                  className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-700 outline-none appearance-none transition-all cursor-pointer"
                >
                  <option value="">Select Experience Level...</option>
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <option key={lvl.value} value={lvl.value}>
                      {lvl.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Professional Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Brief summary of your professional background, goals, and interests..."
                className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 rounded-xl p-4 text-sm text-slate-700 placeholder-slate-400 outline-none transition-all resize-y"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>

        {/* Career Goals Section */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <Target className="w-5 h-5 text-indigo-500" /> Career Goals
            </div>
            <button
              onClick={() => handleOpenGoalForm()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs transition-all border border-indigo-200"
            >
              <Plus className="w-4 h-4" /> Add Career Goal
            </button>
          </div>

          {showGoalForm && (
            <form onSubmit={handleSaveGoal} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                {editingGoalId ? 'Edit Career Goal' : 'New Career Goal'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Target Role *
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="Machine Learning Engineer"
                    required
                    className="w-full bg-white border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 rounded-xl p-2.5 text-sm text-slate-700 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Target Industry
                  </label>
                  <input
                    type="text"
                    value={targetIndustry}
                    onChange={(e) => setTargetIndustry(e.target.value)}
                    placeholder="Technology / FinTech"
                    className="w-full bg-white border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 rounded-xl p-2.5 text-sm text-slate-700 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Target Location
                  </label>
                  <input
                    type="text"
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    placeholder="India / Remote"
                    className="w-full bg-white border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 rounded-xl p-2.5 text-sm text-slate-700 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Priority Number
                  </label>
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value, 10) || 1)}
                    min="1"
                    className="w-full bg-white border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 rounded-xl p-2.5 text-sm text-slate-700 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoalForm(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGoal}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/20"
                >
                  {savingGoal ? 'Saving...' : editingGoalId ? 'Update Goal' : 'Save Goal'}
                </button>
              </div>
            </form>
          )}

          {careerGoals.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-300 rounded-2xl bg-slate-50 text-slate-500 text-sm font-medium">
              No career goals added yet. Click "Add Career Goal" above to specify your target role.
            </div>
          ) : (
            <div className="space-y-4">
              {careerGoals.map((goal, idx) => (
                <div
                  key={goal.id}
                  className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-black flex items-center justify-center shadow-inner">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-800">{goal.targetRole}</h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {goal.targetIndustry || 'Any Industry'} • {goal.targetLocation || 'Any Location'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenGoalForm(goal)}
                      className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
