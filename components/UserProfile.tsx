
import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { UserProfile as IUserProfile } from '../types';
import { 
  User, Mail, Shield, Camera, Save, 
  RefreshCw, CheckCircle2, UserCircle, 
  MapPin, Globe, Award
} from 'lucide-react';

const UserProfile: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [bio, setBio] = useState('');

  const userProfile = useLiveQuery(() => db.settings.get('current_user'));

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName);
      setAvatar(userProfile.avatar);
      setBio(userProfile.bio || '');
    } else {
      // Seed default user if none exists
      db.settings.put({
        key: 'current_user',
        displayName: 'John Doe',
        email: 'admin@staffhub.com',
        role: 'Administrator',
        createdAt: Date.now()
      } as any);
    }
  }, [userProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await db.settings.update('current_user', {
        displayName,
        avatar,
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

  if (!userProfile) return null;

  return (
    <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-slate-50 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
          <div className="h-40 bg-gradient-to-r from-blue-600 to-indigo-700" />
          <div className="px-10 pb-10">
            <div className="flex flex-col md:flex-row items-end gap-6 -mt-16">
              <div className="relative group">
                <div className="w-32 h-32 rounded-3xl bg-white p-1 shadow-lg overflow-hidden border border-slate-100">
                  {avatar ? (
                    <img src={avatar} className="w-full h-full object-cover rounded-2xl" alt="Avatar" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300">
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
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">{displayName}</h2>
                <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Shield size={14} className="text-blue-500" />
                    {userProfile.role}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail size={14} />
                    {userProfile.email}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Edit Form */}
          <div className="lg:col-span-2 space-y-8">
            <form onSubmit={handleSave} className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Account Settings</h3>
                {success && (
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold animate-in fade-in slide-in-from-right-2">
                    <CheckCircle2 size={14} />
                    Saved Successfully
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Display Name</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium text-slate-700"
                    placeholder="Your Full Name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Professional Bio</label>
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium text-slate-700 resize-none"
                    placeholder="Write a brief professional summary..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                    <input 
                      type="email" 
                      value={userProfile.email}
                      readOnly
                      className="w-full px-5 py-3.5 bg-slate-100 border border-slate-100 rounded-2xl text-sm font-medium text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Role</label>
                    <input 
                      type="text" 
                      value={userProfile.role}
                      readOnly
                      className="w-full px-5 py-3.5 bg-slate-100 border border-slate-100 rounded-2xl text-sm font-medium text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className={`
                  w-full py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg
                  ${loading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'}
                `}
              >
                {loading ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                Update Profile
              </button>
            </form>
          </div>

          {/* Quick Info Sidebar */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">User Context</h4>
              <div className="space-y-4">
                <InfoItem icon={<MapPin size={16} />} label="Location" value="Main Office, Tokyo" />
                <InfoItem icon={<Globe size={16} />} label="Language" value="JP / EN" />
                <InfoItem icon={<Award size={16} />} label="Expertise" value="Staff Logistics" />
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
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="flex items-center gap-4 group">
    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-700">{value}</p>
    </div>
  </div>
);

export default UserProfile;
