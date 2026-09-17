import React, { useState, useRef } from 'react';
import { useGym } from '../context/GymContext';
import {
  UserCircle2,
  QrCode,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Info,
  Edit3,
  X,
  Check,
  Lock,
  Camera,
  Scale,
  Ruler,
  HeartPulse,
  Dumbbell,
  Users,
} from 'lucide-react';
import { EnrollmentProgramme, EnrollmentCategory, CenterType } from '../types';

export const ProfileView: React.FC = () => {
  const { currentUser, updateUserProfile, theme } = useGym();
  const [showEditModal, setShowEditModal] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    full_name: currentUser?.full_name || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    date_of_birth: currentUser?.date_of_birth || '',
    profession: currentUser?.profession || '',
    guardian_name: currentUser?.guardian_name || '',
    guardian_phone: currentUser?.guardian_phone || '',
    present_address: currentUser?.present_address || '',
    permanent_address: currentUser?.permanent_address || '',
    body_weight: currentUser?.body_weight || '',
    body_height: currentUser?.body_height || '',
    health_problems: currentUser?.health_problems || '',
    profile_image: currentUser?.profile_image || '',
    // Restricted fields
    member_id: currentUser?.member_id || currentUser?.id || '',
    enrollment_programme: (currentUser?.enrollment_programme || 'Gym') as EnrollmentProgramme,
    enrollment_category: (currentUser?.enrollment_category || 'Ladies & Gents') as EnrollmentCategory,
    center: (currentUser?.center || 'Ranaghat') as CenterType,
  });

  if (!currentUser) {
    return (
      <div className="p-8 text-center text-zinc-400">
        Please sign in or choose a demo persona to view profile.
      </div>
    );
  }

  // Permission check: Member ID, enrollment programme and batch category is editable ONLY by admin or trainers of respective branch
  const canEditRestricted =
    currentUser.role === 'admin' ||
    (currentUser.role === 'trainer' && currentUser.center === formData.center);

  const handleOpenEdit = () => {
    setFormData({
      full_name: currentUser.full_name || '',
      phone: currentUser.phone || '',
      email: currentUser.email || '',
      date_of_birth: currentUser.date_of_birth || '',
      profession: currentUser.profession || '',
      guardian_name: currentUser.guardian_name || '',
      guardian_phone: currentUser.guardian_phone || '',
      present_address: currentUser.present_address || '',
      permanent_address: currentUser.permanent_address || '',
      body_weight: currentUser.body_weight || '',
      body_height: currentUser.body_height || '',
      health_problems: currentUser.health_problems || '',
      profile_image: currentUser.profile_image || '',
      member_id: currentUser.member_id || currentUser.id || '',
      enrollment_programme: (currentUser.enrollment_programme || 'Gym') as EnrollmentProgramme,
      enrollment_category: (currentUser.enrollment_category || 'Ladies & Gents') as EnrollmentCategory,
      center: currentUser.center || 'Ranaghat',
    });
    setSaveSuccessMsg('');
    setShowEditModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profile_image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updatePayload: any = {
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        date_of_birth: formData.date_of_birth.trim(),
        profession: formData.profession.trim(),
        guardian_name: formData.guardian_name.trim(),
        guardian_phone: formData.guardian_phone.trim(),
        present_address: formData.present_address.trim(),
        permanent_address: formData.permanent_address.trim(),
        body_weight: formData.body_weight ? Number(formData.body_weight) : undefined,
        body_height: String(formData.body_height || '').trim(),
        health_problems: formData.health_problems.trim(),
        profile_image: formData.profile_image,
      };

      if (canEditRestricted) {
        updatePayload.member_id = String(formData.member_id || '').trim();
        updatePayload.enrollment_programme = formData.enrollment_programme;
        updatePayload.enrollment_category = formData.enrollment_category;
        if (currentUser.role === 'admin') {
          updatePayload.center = formData.center;
        }
      }

      updateUserProfile(currentUser.id, updatePayload);
      setSaveSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        setShowEditModal(false);
        setSaveSuccessMsg('');
      }, 1200);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Athlete Profile & Digital Pass</h2>
          <p className="text-xs text-zinc-400">
            Official Hercules Gym identification, membership credential, and center protocols
          </p>
        </div>
        <button
          onClick={handleOpenEdit}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black shadow-lg shadow-rose-950/40 transition-all active:scale-95 self-start sm:self-auto"
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit Profile</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Digital Membership ID Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-rose-950/60 to-zinc-950 border border-rose-500/40 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="/hercules-logo-removebg-preview.png"
                  alt="Hercules Gym"
                  className="w-8 h-8 object-contain"
                />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                    HERCULES GYM PASS
                  </span>
                  <div className="text-[10px] text-zinc-400">Nadia Fitness Network</div>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase">
                {currentUser.membership?.status || 'Active'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {currentUser.profile_image ? (
                <img
                  src={currentUser.profile_image}
                  alt={currentUser.full_name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-rose-500 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-600/30 via-rose-500/20 to-amber-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center font-black text-xl shrink-0">
                  {currentUser.full_name?.charAt(0)?.toUpperCase() || 'M'}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-base font-black text-white truncate">{currentUser.full_name}</h3>
                <div className="text-xs text-rose-400 font-bold capitalize">{currentUser.role}</div>
                <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-rose-500" />
                  <span>{currentUser.center} Home Branch</span>
                </div>
              </div>
            </div>

            {/* Member ID Digital Pass Card (QR Code Removed) */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-zinc-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  MEMBER ID
                </div>
                <div className="font-mono text-sm font-black text-rose-400 tracking-wider">
                  {currentUser.member_id || currentUser.id}
                </div>
                <div className="text-[10px] text-zinc-400">Verified Nadia Fitness Network Pass</div>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-rose-600/15 border border-rose-500/30 text-rose-400 text-xs font-bold">
                {currentUser.center} Center
              </div>
            </div>

            {/* Programme & Category info */}
            <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-zinc-800/80 pt-3">
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <div className="text-zinc-500 text-[10px] font-bold uppercase">Programme</div>
                <div className="font-black text-white mt-0.5">{currentUser.enrollment_programme || 'Gym'}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <div className="text-zinc-500 text-[10px] font-bold uppercase">Batch Category</div>
                <div className="font-bold text-amber-300 mt-0.5 truncate">{currentUser.enrollment_category || 'Ladies & Gents'}</div>
              </div>
            </div>

            {currentUser.membership && (
              <div className="text-[10px] text-zinc-400 flex justify-between border-t border-zinc-800 pt-3">
                <span>Tier: {currentUser.membership.plan_name}</span>
                <span>Exp: {currentUser.membership.end_date}</span>
              </div>
            )}

            <button
              onClick={handleOpenEdit}
              className="w-full py-2.5 rounded-2xl bg-zinc-800/90 hover:bg-zinc-700/90 border border-zinc-700/80 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5 text-rose-400" />
              <span>Edit Personal Details</span>
            </button>
          </div>
        </div>

        {/* Profile Details & Center Protocols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className={`p-6 rounded-3xl border space-y-4 ${
            theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white">Contact & Profile Information</h3>
              <button
                onClick={handleOpenEdit}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-400 text-[11px]">Email Address</span>
                <div className="font-bold text-white mt-0.5">{currentUser.email}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-400 text-[11px]">Registered Phone</span>
                <div className="font-bold text-white mt-0.5">{currentUser.phone}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-400 text-[11px]">Profession</span>
                <div className="font-bold text-white mt-0.5">{currentUser.profession || 'Not Specified'}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-400 text-[11px]">Date of Birth</span>
                <div className="font-bold text-white mt-0.5">{currentUser.date_of_birth || 'Not Specified'}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-400 text-[11px]">Guardian Name & Phone</span>
                <div className="font-bold text-white mt-0.5">
                  {currentUser.guardian_name ? `${currentUser.guardian_name} (${currentUser.guardian_phone || 'No phone'})` : 'N/A'}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-400 text-[11px]">Present Address</span>
                <div className="font-bold text-white mt-0.5 truncate">{currentUser.present_address || 'Not Provided'}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-400 text-[11px]">Home Center</span>
                <div className="font-bold text-white mt-0.5">{currentUser.center} Branch</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-400 text-[11px]">Account Status</span>
                <div className="font-bold text-emerald-400 mt-0.5">Verified & Approved</div>
              </div>
            </div>
          </div>

          {/* Physical Measurements & Health */}
          <div className={`p-6 rounded-3xl border space-y-4 ${
            theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <h3 className="text-base font-extrabold text-white">Physical Assessment & Health Records</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-400 text-[11px] flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-rose-500" />
                  Body Weight
                </span>
                <div className="font-bold text-white mt-1">
                  {currentUser.body_weight ? `${currentUser.body_weight} kg` : 'Not recorded'}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-400 text-[11px] flex items-center gap-1">
                  <Ruler className="w-3.5 h-3.5 text-rose-500" />
                  Body Height
                </span>
                <div className="font-bold text-white mt-1">
                  {currentUser.body_height || 'Not recorded'}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-400 text-[11px] flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                  Medical History
                </span>
                <div className="font-bold text-white mt-1 truncate">
                  {currentUser.health_problems || 'None / Cleared'}
                </div>
              </div>
            </div>
          </div>

          {/* Gym Center Timings & Rules */}
          <div className={`p-6 rounded-3xl border space-y-4 ${
            theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-rose-500" />
              <h3 className="text-base font-extrabold text-white">Center Operating Hours</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <div className="font-bold text-rose-400">Ranaghat Center</div>
                <div className="text-zinc-300 mt-1">Mon - Sat: 5:30 AM - 10:00 PM</div>
                <div className="text-zinc-500 text-[10px]">Sunday: 6:00 AM - 1:00 PM</div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <div className="font-bold text-rose-400">Chakdah Center</div>
                <div className="text-zinc-300 mt-1">Mon - Sat: 6:00 AM - 9:30 PM</div>
                <div className="text-zinc-500 text-[10px]">Sunday: 6:00 AM - 12:00 PM</div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <div className="font-bold text-rose-400">Madanpur Center</div>
                <div className="text-zinc-300 mt-1">Mon - Sat: 6:00 AM - 9:30 PM</div>
                <div className="text-zinc-500 text-[10px]">Sunday: 7:00 AM - 12:00 PM</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <AlertTriangle className="w-4 h-4" />
                Floor Rules & Etiquette
              </div>
              <ul className="list-disc pl-5 space-y-1 text-zinc-300 text-[11px] leading-relaxed">
                <li>Always re-rack dumbbells and bumper plates after finishing your working sets.</li>
                <li>Carry a clean workout towel and sanitize equipment benches after use.</li>
                <li>Proper athletic footwear is mandatory at all times on the gym floor.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Unified, Flexible, Non-Obstructed Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md overflow-y-auto p-3 sm:p-6 md:p-8 flex justify-center items-start sm:items-center">
          <div
            className={`w-full max-w-3xl my-auto rounded-3xl border shadow-2xl overflow-hidden max-h-[calc(100vh-2.5rem)] sm:max-h-[calc(100vh-4rem)] flex flex-col ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            {/* Modal Header (Sticky at top of dialog, never obstructed) */}
            <div className="shrink-0 p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">Edit Profile & Account Details</h3>
                  <p className="text-xs text-zinc-400">Update personal, contact, physical, and membership details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body (Scrollable internal view) */}
            <form id="edit-profile-form" onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
              {saveSuccessMsg && (
                <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Profile Photo */}
              <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 space-y-3">
                <div className="text-xs font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Profile Photo</span>
                </div>

                <div className="flex items-center gap-4">
                  {formData.profile_image ? (
                    <img
                      src={formData.profile_image}
                      alt="Preview"
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-rose-500 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-950/60 to-zinc-900 border border-zinc-700 text-rose-400 flex items-center justify-center font-black text-xl shrink-0">
                      {formData.full_name?.charAt(0)?.toUpperCase() || 'M'}
                    </div>
                  )}

                  <div className="space-y-2 flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5 text-rose-400" />
                        <span>Upload Photo</span>
                      </button>
                      {formData.profile_image && (
                        <button
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, profile_image: '' }))}
                          className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold text-xs"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Or paste profile image URL..."
                      value={formData.profile_image}
                      onChange={e => setFormData(p => ({ ...p, profile_image: e.target.value }))}
                      className="w-full p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Restricted Membership Info (Admin & Branch Trainer Editable Only) */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                canEditRestricted
                  ? 'bg-rose-950/20 border-rose-500/40'
                  : 'bg-zinc-950/70 border-zinc-800/90'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5" />
                    <span>Gym Membership & Batch Details</span>
                  </div>
                  {canEditRestricted ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Editable (Admin / Branch Trainer)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Admin / Trainer Managed</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Member ID */}
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1 flex items-center justify-between">
                      <span>Member ID</span>
                      {!canEditRestricted && <Lock className="w-3 h-3 text-zinc-500" />}
                    </label>
                    <input
                      type="text"
                      disabled={!canEditRestricted}
                      value={formData.member_id}
                      onChange={e => setFormData(p => ({ ...p, member_id: e.target.value }))}
                      placeholder="e.g. HG-RAN-101"
                      className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                        canEditRestricted
                          ? 'bg-zinc-900 border-zinc-700 text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  {/* Enrollment Programme */}
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1 flex items-center justify-between">
                      <span>Enrollment Programme</span>
                      {!canEditRestricted && <Lock className="w-3 h-3 text-zinc-500" />}
                    </label>
                    {canEditRestricted ? (
                      <select
                        value={formData.enrollment_programme}
                        onChange={e =>
                          setFormData(p => ({
                            ...p,
                            enrollment_programme: e.target.value as EnrollmentProgramme,
                          }))
                        }
                        className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                      >
                        <option value="Gym">Gym</option>
                        <option value="Karate">Karate</option>
                        <option value="Yoga">Yoga</option>
                        <option value="Crossfit">Crossfit</option>
                        <option value="Kidsfit">Kidsfit</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        disabled
                        value={formData.enrollment_programme}
                        className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 font-bold cursor-not-allowed"
                      />
                    )}
                  </div>

                  {/* Enrollment Category */}
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1 flex items-center justify-between">
                      <span>Batch Category</span>
                      {!canEditRestricted && <Lock className="w-3 h-3 text-zinc-500" />}
                    </label>
                    {canEditRestricted ? (
                      <select
                        value={formData.enrollment_category}
                        onChange={e =>
                          setFormData(p => ({
                            ...p,
                            enrollment_category: e.target.value as EnrollmentCategory,
                          }))
                        }
                        className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                      >
                        <option value="Ladies & Gents">Ladies & Gents</option>
                        <option value="Ladies">Ladies Only</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        disabled
                        value={formData.enrollment_category}
                        className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 font-bold cursor-not-allowed"
                      />
                    )}
                  </div>
                </div>

                {!canEditRestricted && (
                  <p className="text-[11px] text-zinc-500 flex items-center gap-1.5 pt-1">
                    <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Member ID, Enrollment Programme, and Batch Category are editable only by your branch Admin or assigned Trainers.</span>
                  </p>
                )}
              </div>

              {/* Section: Personal & Contact */}
              <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 space-y-3">
                <div className="text-xs font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5">
                  <UserCircle2 className="w-3.5 h-3.5" />
                  <span>Personal & Contact Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Profession</label>
                    <input
                      type="text"
                      value={formData.profession}
                      onChange={e => setFormData(p => ({ ...p, profession: e.target.value }))}
                      placeholder="e.g. Software Engineer, Student"
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={e => setFormData(p => ({ ...p, date_of_birth: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Home Center Branch</label>
                    {currentUser.role === 'admin' ? (
                      <select
                        value={formData.center}
                        onChange={e => setFormData(p => ({ ...p, center: e.target.value as CenterType }))}
                        className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                      >
                        <option value="Ranaghat">Ranaghat</option>
                        <option value="Chakdah">Chakdah</option>
                        <option value="Madanpur">Madanpur</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        disabled
                        value={`${currentUser.center} Branch`}
                        className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 font-bold cursor-not-allowed"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Section: Guardian & Address */}
              <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 space-y-3">
                <div className="text-xs font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Guardian & Address Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Guardian Name</label>
                    <input
                      type="text"
                      value={formData.guardian_name}
                      onChange={e => setFormData(p => ({ ...p, guardian_name: e.target.value }))}
                      placeholder="e.g. Biman Paul"
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Guardian Contact Phone</label>
                    <input
                      type="tel"
                      value={formData.guardian_phone}
                      onChange={e => setFormData(p => ({ ...p, guardian_phone: e.target.value }))}
                      placeholder="e.g. 9876543210"
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Present Address</label>
                    <textarea
                      rows={2}
                      value={formData.present_address}
                      onChange={e => setFormData(p => ({ ...p, present_address: e.target.value }))}
                      placeholder="Street, City, Pin Code"
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Permanent Address</label>
                    <textarea
                      rows={2}
                      value={formData.permanent_address}
                      onChange={e => setFormData(p => ({ ...p, permanent_address: e.target.value }))}
                      placeholder="Street, City, Pin Code"
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Physical & Health */}
              <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 space-y-3">
                <div className="text-xs font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5" />
                  <span>Physical Assessment & Health</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Body Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.body_weight}
                      onChange={e => setFormData(p => ({ ...p, body_weight: e.target.value }))}
                      placeholder="e.g. 72.5"
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Body Height</label>
                    <input
                      type="text"
                      value={formData.body_height}
                      onChange={e => setFormData(p => ({ ...p, body_height: e.target.value }))}
                      placeholder="e.g. 175 cm or 5'9''"
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Health Problems / History</label>
                    <input
                      type="text"
                      value={formData.health_problems}
                      onChange={e => setFormData(p => ({ ...p, health_problems: e.target.value }))}
                      placeholder="e.g. None, Asthma, High BP"
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Modal Footer (Sticky at bottom of dialog) */}
            <div className="shrink-0 p-4 sm:p-6 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="edit-profile-form"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-rose-950/40 flex items-center gap-2 transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
