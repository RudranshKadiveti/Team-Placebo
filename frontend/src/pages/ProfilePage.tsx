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
      await loadProfileData(); // Reload profile & goals
      setMessage({ type: 'success', text: editingGoalId ? 'Career goal updated' : 'Career goal added' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save career goal' });
    } finally {
      setSavingGoal(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this career goal?')) return;
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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 font-semibold transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <User className="w-8 h-8 text-blue-400" /> User Profile & Career Intelligence
            </h1>
          </div>

          {/* Profile Completion Indicator */}
          <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-xl p-4 flex items-center gap-4 shrink-0 shadow-lg">
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1">
                <span>Profile Completion</span>
                <span className="text-blue-400 font-bold">{completionPercentage}%</span>
              </div>
              <div className="w-48 bg-slate-800 h-2.5 rounded-full overflow-hidden">
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
            className={`p-4 rounded-xl border text-sm flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSaveProfile} className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-200 border-b border-slate-800 pb-3">
            <User className="w-5 h-5 text-blue-400" /> Personal & Educational Details
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Full Name (Account)
              </label>
              <input
                type="text"
                value={user?.name || ''}
                disabled
                className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl py-2.5 px-3.5 text-sm text-slate-400 cursor-not-allowed outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Email Address (Account)
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl py-2.5 px-3.5 text-sm text-slate-400 cursor-not-allowed outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full bg-slate-800/60 border border-slate-700/60 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-slate-100 placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Bengaluru, India"
                  className="w-full bg-slate-800/60 border border-slate-700/60 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-slate-100 placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                University / Institution
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Stanford University"
                  className="w-full bg-slate-800/60 border border-slate-700/60 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-slate-100 placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Degree
              </label>
              <div className="relative">
                <Award className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="Bachelor of Science"
                  className="w-full bg-slate-800/60 border border-slate-700/60 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-slate-100 placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Field of Study
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={fieldOfStudy}
                  onChange={(e) => setFieldOfStudy(e.target.value)}
                  placeholder="Computer Science & AI"
                  className="w-full bg-slate-800/60 border border-slate-700/60 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-slate-100 placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Graduation Year
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="number"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value ? parseInt(e.target.value, 10) : '')}
                  placeholder="2025"
                  min="1950"
                  max="2100"
                  className="w-full bg-slate-800/60 border border-slate-700/60 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-slate-100 placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Experience Level
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                  className="w-full bg-slate-800/60 border border-slate-700/60 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-slate-100 outline-none appearance-none"
                >
                  <option value="" className="bg-slate-900">Select Experience Level...</option>
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <option key={lvl.value} value={lvl.value} className="bg-slate-900">
                      {lvl.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Professional Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Brief summary of your professional background, goals, and interests..."
                className="w-full bg-slate-800/60 border border-slate-700/60 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm transition-all duration-150 shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingProfile ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>

        {/* Career Goals Section */}
        <section className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-lg font-bold text-slate-200">
              <Target className="w-5 h-5 text-indigo-400" /> Career Goals
            </div>
            <button
              onClick={() => handleOpenGoalForm()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" /> Add Career Goal
            </button>
          </div>

          {showGoalForm && (
            <form onSubmit={handleSaveGoal} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                {editingGoalId ? 'Edit Career Goal' : 'New Career Goal'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Target Role *
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="Machine Learning Engineer"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Target Industry
                  </label>
                  <input
                    type="text"
                    value={targetIndustry}
                    onChange={(e) => setTargetIndustry(e.target.value)}
                    placeholder="Technology / FinTech"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Target Location
                  </label>
                  <input
                    type="text"
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    placeholder="India / Remote"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Priority Number
                  </label>
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value, 10) || 1)}
                    min="1"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoalForm(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGoal}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 disabled:opacity-50"
                >
                  {savingGoal ? 'Saving...' : editingGoalId ? 'Update Goal' : 'Save Goal'}
                </button>
              </div>
            </form>
          )}

          {careerGoals.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
              No career goals added yet. Click "Add Career Goal" above to specify your target role.
            </div>
          ) : (
            <div className="space-y-3">
              {careerGoals.map((goal, idx) => (
                <div
                  key={goal.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-100">{goal.targetRole}</h4>
                      <p className="text-xs text-slate-400">
                        {goal.targetIndustry || 'Any Industry'} • {goal.targetLocation || 'Any Location'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenGoalForm(goal)}
                      className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"
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
