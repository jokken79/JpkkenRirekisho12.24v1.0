import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCurrentUserProfile, userProfileService } from '../lib/useSupabase';
import { useAuth } from './AuthProvider';
import { useTheme } from './ThemeProvider';
import {
  User, Mail, Shield, Camera, Save,
  RefreshCw, CheckCircle2, UserCircle,
  MapPin, Globe, Award
} from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { staggerContainer, fadeInUp } from '../lib/animations';

const UserProfile: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [bio, setBio] = useState('');

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const userProfile = useCurrentUserProfile();
  const { user } = useAuth();

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.display_name || '');
      setAvatar(userProfile.avatar_url || undefined);
      setBio(userProfile.bio || '');
    }
  }, [userProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userProfileService.upsert({
        display_name: displayName,
        avatar_url: avatar,
        bio
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Show loading skeleton if profile isn't loaded yet
  if (userProfile === undefined) {
    return (
      <div className={`flex-1 overflow-y-auto p-8 lg:p-12 flex flex-col items-center transition-colors ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="max-w-4xl w-full space-y-8">
          {/* Header skeleton */}
          <div className={`rounded-[2.5rem] shadow-xl border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
            <Skeleton className="h-40 w-full" />
            <div className="px-10 pb-10">
              <div className="flex items-end gap-6 -mt-16">
                <Skeleton variant="rounded" className="w-32 h-32" />
                <div className="space-y-2 mb-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            </div>
          </div>
          {/* Form skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className={`p-10 rounded-[2.5rem] shadow-xl border space-y-8 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                <Skeleton className="h-6 w-40" />
                <div className="space-y-6">
                  <Skeleton className="h-12 w-full rounded-2xl" />
                  <Skeleton className="h-24 w-full rounded-2xl" />
                  <div className="grid grid-cols-2 gap-6">
                    <Skeleton className="h-12 w-full rounded-2xl" />
                    <Skeleton className="h-12 w-full rounded-2xl" />
                  </div>
                </div>
                <Skeleton className="h-14 w-full rounded-2xl" />
              </div>
            </div>
            <div className="space-y-8">
              <Skeleton className="h-48 w-full rounded-[2.5rem]" />
              <Skeleton className="h-40 w-full rounded-[2.5rem]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get email from auth user, role from profile
  const userEmail = user?.email || 'Unknown';
  const userRole = userProfile?.role || 'User';

  return (
    <motion.div
      className={`flex-1 overflow-y-auto p-8 lg:p-12 flex flex-col items-center transition-colors ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <div className="max-w-4xl w-full space-y-8">

        {/* Profile Header Card */}
        <motion.div variants={fadeInUp} className={`rounded-[2.5rem] shadow-xl border overflow-hidden relative ${isDark ? 'bg-slate-800 border-slate-700 shadow-slate-900/50' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
          <div className="h-40 bg-gradient-to-r from-blue-600 to-indigo-700" />
          <div className="px-10 pb-10">
            <div className="flex flex-col md:flex-row items-end gap-6 -mt-16">
              <div className="relative group">
                <div className={`w-32 h-32 rounded-3xl p-1 shadow-lg overflow-hidden border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-100'}`}>
                  {avatar ? (
                    <img src={avatar} className="w-full h-full object-cover rounded-2xl" alt="Avatar" />
                  ) : (
                    <div className={`w-full h-full rounded-2xl flex items-center justify-center ${isDark ? 'bg-slate-600 text-slate-500' : 'bg-slate-100 text-slate-300'}`}>
                      <UserCircle size={64} strokeWidth={1} />
                    </div>
                  )}
                  <label className="absolute inset-1 bg-black/40 text-white flex flex-col items-center justify-center rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera size={24} />
                    <span className="text-[10px] font-bold mt-1 uppercase">Change</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  </label>
                </div>
              </div>
              <div className="flex-1 space-y-1 mb-2">
                <h2 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>{displayName}</h2>
                <div className={`flex items-center gap-4 text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <div className="flex items-center gap-1.5">
                    <Shield size={14} className="text-blue-500" />
                    {userRole}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail size={14} />
                    {userEmail}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Edit Form */}
          <div className="lg:col-span-2 space-y-8">
            <form onSubmit={handleSave} className={`p-10 rounded-[2.5rem] shadow-xl border space-y-8 ${isDark ? 'bg-slate-800 border-slate-700 shadow-slate-900/50' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Account Settings</h3>
                {success && (
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold animate-in fade-in slide-in-from-right-2 ${isDark ? 'text-emerald-400 bg-emerald-900/30' : 'text-emerald-600 bg-emerald-50'}`}>
                    <CheckCircle2 size={14} />
                    Saved Successfully
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest px-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={`w-full px-5 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:bg-slate-600' : 'bg-slate-50 border-slate-100 text-slate-700 focus:bg-white'}`}
                    placeholder="Your Full Name"
                  />
                </div>

                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest px-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Professional Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className={`w-full px-5 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium resize-none ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:bg-slate-600' : 'bg-slate-50 border-slate-100 text-slate-700 focus:bg-white'}`}
                    placeholder="Write a brief professional summary..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase tracking-widest px-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Email Address</label>
                    <input
                      type="email"
                      value={userEmail}
                      readOnly
                      className={`w-full px-5 py-3.5 border rounded-2xl text-sm font-medium cursor-not-allowed ${isDark ? 'bg-slate-700 border-slate-600 text-slate-500' : 'bg-slate-100 border-slate-100 text-slate-400'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase tracking-widest px-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Role</label>
                    <input
                      type="text"
                      value={userRole}
                      readOnly
                      className={`w-full px-5 py-3.5 border rounded-2xl text-sm font-medium cursor-not-allowed ${isDark ? 'bg-slate-700 border-slate-600 text-slate-500' : 'bg-slate-100 border-slate-100 text-slate-400'}`}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`
                  w-full py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg
                  ${loading ? (isDark ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed') : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'}
                `}
              >
                {loading ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                Update Profile
              </button>
            </form>
          </div>

          {/* Quick Info Sidebar */}
          <div className="space-y-8">
            <div className={`p-8 rounded-[2.5rem] shadow-xl border space-y-6 ${isDark ? 'bg-slate-800 border-slate-700 shadow-slate-900/50' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
              <h4 className={`text-sm font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>User Context</h4>
              <div className="space-y-4">
                <InfoItem icon={<MapPin size={16} />} label="Location" value="Main Office, Tokyo" isDark={isDark} />
                <InfoItem icon={<Globe size={16} />} label="Language" value="JP / EN" isDark={isDark} />
                <InfoItem icon={<Award size={16} />} label="Expertise" value="Staff Logistics" isDark={isDark} />
              </div>
            </div>

            <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl shadow-blue-500/30 text-white relative overflow-hidden group">
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700" />
              <div className="relative z-10 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest opacity-60">System Version</h4>
                <div className="space-y-1">
                   <p className="text-2xl font-black">UNS Enterprise</p>
                   <p className="text-sm font-bold opacity-80 text-blue-100">Build 2.4.120-PRO</p>
                </div>
                <div className="pt-4">
                  <span className="text-[10px] font-bold px-3 py-1 bg-white/20 rounded-full">LATEST STABLE</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const InfoItem = ({ icon, label, value, isDark = false }: { icon: React.ReactNode, label: string, value: string, isDark?: boolean }) => (
  <div className="flex items-center gap-4 group">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDark ? 'bg-slate-700 text-slate-500 group-hover:bg-blue-900/50 group-hover:text-blue-400' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
      {icon}
    </div>
    <div>
      <p className={`text-[9px] font-bold uppercase tracking-widest leading-none mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
      <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>{value}</p>
    </div>
  </div>
);

export default UserProfile;
