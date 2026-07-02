import { useState, useRef } from 'react'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { updateUser, logoutUser } from '../store/slices/authSlice'
import { toggleDarkMode } from '../store/slices/uiSlice'
import { authService } from '../services/authService'
import { userService, notificationService } from '../services'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Avatar from '../components/ui/Avatar'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Moon, Sun, Shield, Bell, Key, Laptop, Trash2, Camera, User,
  Globe, Github, Linkedin, MapPin, Briefcase, Upload, LogOut,
  AlertTriangle, Check, Monitor, Smartphone, Clock
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'

type Tab = 'profile' | 'account' | 'security' | 'notifications' | 'sessions'

export default function SettingsPage() {
  const { user } = useAppSelector(s => s.auth)
  const { darkMode } = useAppSelector(s => s.ui)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [show2FA, setShow2FA] = useState(false)
  const [tfaCode, setTfaCode] = useState('')
  const [tfaData, setTfaData] = useState<{ secret: string; otpauth_url: string } | null>(null)
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    headline: user?.headline || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    github_username: user?.github_username || '',
    linkedin_url: user?.linkedin_url || '',
    open_to_work: user?.open_to_work || false,
  })

  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => authService.getSessions().then(r => r.data.sessions as any[]),
    enabled: activeTab === 'sessions',
  })

  const { data: prefs, refetch: refetchPrefs } = useQuery({
    queryKey: ['notif-prefs'],
    queryFn: () => notificationService.getPreferences().then(r => r.data.preferences as Record<string, boolean>),
    enabled: activeTab === 'notifications',
  })

  const avatarMutation = useMutation({
    mutationFn: (file: File) => userService.uploadAvatar(file),
    onSuccess: (r) => { dispatch(updateUser({ avatar_url: r.data.avatar_url })); toast.success('Profile photo updated') },
    onError: () => toast.error('Failed to upload photo'),
  })

  const coverMutation = useMutation({
    mutationFn: (file: File) => userService.uploadCover(file),
    onSuccess: (r) => { dispatch(updateUser({ cover_url: r.data.cover_url })); toast.success('Cover photo updated') },
    onError: () => toast.error('Failed to upload cover'),
  })

  const profileMutation = useMutation({
    mutationFn: () => userService.updateProfile(profileForm),
    onSuccess: (r) => { dispatch(updateUser(r.data.profile)); toast.success('Profile saved') },
    onError: () => toast.error('Failed to save profile'),
  })

  const changePwMutation = useMutation({
    mutationFn: () => authService.changePassword(currentPw, newPw),
    onSuccess: () => { toast.success('Password changed'); setCurrentPw(''); setNewPw(''); setConfirmPw('') },
    onError: () => toast.error('Incorrect current password'),
  })

  const setup2FAMutation = useMutation({
    mutationFn: () => authService.setup2FA(),
    onSuccess: (r) => { setTfaData(r.data); setShow2FA(true) },
  })

  const enable2FAMutation = useMutation({
    mutationFn: () => authService.verify2FA(tfaCode),
    onSuccess: () => { toast.success('2FA enabled'); setShow2FA(false); setTfaCode(''); dispatch(updateUser({ two_factor_enabled: true })) },
  })

  const disable2FAMutation = useMutation({
    mutationFn: () => authService.disable2FA(tfaCode),
    onSuccess: () => { toast.success('2FA disabled'); setTfaCode(''); dispatch(updateUser({ two_factor_enabled: false })) },
  })

  const revokeSessionMutation = useMutation({
    mutationFn: (id: string) => authService.revokeSession(id),
    onSuccess: () => { toast.success('Session revoked'); queryClient.invalidateQueries({ queryKey: ['sessions'] }) },
  })

  const prefMutation = useMutation({
    mutationFn: (updated: Record<string, boolean>) => notificationService.updatePreferences(updated),
    onSuccess: () => refetchPrefs(),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast.error('File must be under 10MB'); return }
    type === 'avatar' ? avatarMutation.mutate(file) : coverMutation.mutate(file)
    e.target.value = ''
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Laptop },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'sessions', label: 'Sessions', icon: Key },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-6">Settings</h1>

      <div className="flex gap-6">
        <aside className="w-44 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={id === activeTab ? 'sidebar-item-active w-full' : 'sidebar-item w-full'}>
                <Icon size={16} />{label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 space-y-4 min-w-0">

          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <>
              {/* Cover + Avatar */}
              <div className="card overflow-hidden">
                <div className="relative h-32 bg-gradient-to-br from-primary-500 to-primary-700">
                  {user?.cover_url && <img src={user.cover_url} alt="Cover" className="w-full h-full object-cover" />}
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity text-white gap-2 text-sm font-medium"
                  >
                    <Camera size={16} /> Change Cover
                  </button>
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'cover')} />
                </div>
                <div className="px-6 pb-5 pt-0">
                  <div className="flex items-end gap-4 -mt-8 mb-4">
                    <div className="relative flex-shrink-0">
                      <Avatar user={user} size="xl" className="ring-4 ring-white dark:ring-surface-900" />
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={avatarMutation.isPending}
                        className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                      >
                        {avatarMutation.isPending
                          ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <Camera size={16} className="text-white" />}
                      </button>
                      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'avatar')} />
                    </div>
                    <div>
                      <p className="font-semibold text-surface-900 dark:text-white">{user?.full_name}</p>
                      <p className="text-sm text-surface-500">@{user?.username}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => avatarInputRef.current?.click()} className="btn-secondary text-sm flex items-center gap-1.5 px-3 py-1.5">
                      <Upload size={13} /> Upload Photo
                    </button>
                    <button onClick={() => coverInputRef.current?.click()} className="btn-secondary text-sm flex items-center gap-1.5 px-3 py-1.5">
                      <Camera size={13} /> Change Cover
                    </button>
                  </div>
                </div>
              </div>

              {/* Basic info */}
              <div className="card p-6 space-y-4">
                <h2 className="font-semibold text-surface-900 dark:text-white">Basic Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Full Name" value={profileForm.full_name} onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))} />
                  <Input label="Headline" placeholder="e.g. Senior Developer" value={profileForm.headline} onChange={e => setProfileForm(f => ({ ...f, headline: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Bio</label>
                  <textarea className="input resize-none" rows={3} placeholder="Tell people about yourself..." value={profileForm.bio} onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Location" placeholder="City, Country" value={profileForm.location} onChange={e => setProfileForm(f => ({ ...f, location: e.target.value }))} />
                  <Input label="Website" placeholder="https://yoursite.com" value={profileForm.website} onChange={e => setProfileForm(f => ({ ...f, website: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="GitHub Username" placeholder="yourusername" value={profileForm.github_username} onChange={e => setProfileForm(f => ({ ...f, github_username: e.target.value }))} />
                  <Input label="LinkedIn URL" placeholder="https://linkedin.com/in/..." value={profileForm.linkedin_url} onChange={e => setProfileForm(f => ({ ...f, linkedin_url: e.target.value }))} />
                </div>
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium text-surface-700 dark:text-surface-300">Open to work</p>
                    <p className="text-xs text-surface-400">Show recruiters you're available</p>
                  </div>
                  <button onClick={() => setProfileForm(f => ({ ...f, open_to_work: !f.open_to_work }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${profileForm.open_to_work ? 'bg-primary-600' : 'bg-surface-300'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${profileForm.open_to_work ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <Button onClick={() => profileMutation.mutate()} loading={profileMutation.isPending}>Save Profile</Button>
              </div>
            </>
          )}

          {/* ── ACCOUNT TAB ── */}
          {activeTab === 'account' && (
            <div className="space-y-4">
              <div className="card p-6 space-y-4">
                <h2 className="font-semibold text-surface-900 dark:text-white">Appearance</h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {darkMode ? <Moon size={18} className="text-primary-500" /> : <Sun size={18} className="text-amber-500" />}
                    <div>
                      <p className="text-sm font-medium text-surface-700 dark:text-surface-300">Dark Mode</p>
                      <p className="text-xs text-surface-400">Switch between light and dark themes</p>
                    </div>
                  </div>
                  <button onClick={() => dispatch(toggleDarkMode())}
                    className={`relative w-11 h-6 rounded-full transition-colors ${darkMode ? 'bg-primary-600' : 'bg-surface-300'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>

              <div className="card p-6 space-y-3">
                <h2 className="font-semibold text-surface-900 dark:text-white">Account Info</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800">
                    <span className="text-surface-500">Email</span>
                    <span className="text-surface-900 dark:text-white font-medium">{user?.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800">
                    <span className="text-surface-500">Username</span>
                    <span className="text-surface-900 dark:text-white font-medium">@{user?.username}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800">
                    <span className="text-surface-500">Role</span>
                    <span className="badge-primary capitalize">{user?.role}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-surface-500">Email verified</span>
                    <span className={`flex items-center gap-1 text-xs font-medium ${user?.email_verified ? 'text-green-600' : 'text-amber-600'}`}>
                      {user?.email_verified ? <><Check size={12} /> Verified</> : 'Not verified'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card p-6 space-y-3 border border-red-200 dark:border-red-900/40">
                <h2 className="font-semibold text-red-600 flex items-center gap-2"><AlertTriangle size={16} />Danger Zone</h2>
                <p className="text-sm text-surface-500">Once you sign out from all devices, all active sessions will be invalidated.</p>
                <Button variant="danger" size="sm" icon={<LogOut size={14} />} onClick={() => { dispatch(logoutUser() as any); navigate('/login') }}>
                  Sign out everywhere
                </Button>
              </div>
            </div>
          )}

          {/* ── SECURITY TAB ── */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="card p-6 space-y-4">
                <h2 className="font-semibold text-surface-900 dark:text-white">Change Password</h2>
                <Input label="Current Password" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} />
                <Input label="New Password" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} hint="Minimum 8 characters" />
                <Input label="Confirm New Password" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
                {newPw && confirmPw && newPw !== confirmPw && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
                <Button
                  onClick={() => changePwMutation.mutate()}
                  loading={changePwMutation.isPending}
                  disabled={!currentPw || newPw.length < 8 || newPw !== confirmPw}
                >
                  Update Password
                </Button>
              </div>

              <div className="card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-surface-900 dark:text-white">Two-Factor Authentication</h2>
                    <p className="text-sm text-surface-500 mt-0.5">Protect your account with an authenticator app</p>
                  </div>
                  <span className={`badge ${user?.two_factor_enabled ? 'bg-green-100 text-green-700' : 'badge-gray'}`}>
                    {user?.two_factor_enabled ? '✓ Enabled' : 'Disabled'}
                  </span>
                </div>

                {!user?.two_factor_enabled && !show2FA && (
                  <Button variant="secondary" onClick={() => setup2FAMutation.mutate()} loading={setup2FAMutation.isPending}>
                    Set up 2FA
                  </Button>
                )}

                {show2FA && tfaData && (
                  <div className="space-y-3">
                    <p className="text-sm text-surface-600 dark:text-surface-400">
                      Scan the QR code with Google Authenticator or Authy, then enter the 6-digit code:
                    </p>
                    <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
                      <p className="text-xs text-surface-500 mb-1">Secret key (manual entry):</p>
                      <p className="text-xs font-mono text-surface-800 dark:text-surface-200 break-all select-all">{tfaData.secret}</p>
                    </div>
                    <Input placeholder="Enter 6-digit code" value={tfaCode} onChange={e => setTfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} />
                    <div className="flex gap-2">
                      <Button onClick={() => enable2FAMutation.mutate()} loading={enable2FAMutation.isPending} disabled={tfaCode.length !== 6}>
                        Verify & Enable
                      </Button>
                      <Button variant="secondary" onClick={() => { setShow2FA(false); setTfaCode('') }}>Cancel</Button>
                    </div>
                  </div>
                )}

                {user?.two_factor_enabled && (
                  <div className="space-y-3">
                    <p className="text-sm text-surface-500">Enter your current 2FA code to disable it:</p>
                    <Input placeholder="6-digit code" value={tfaCode} onChange={e => setTfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} />
                    <Button variant="danger" onClick={() => disable2FAMutation.mutate()} loading={disable2FAMutation.isPending} disabled={tfaCode.length !== 6}>
                      Disable 2FA
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS TAB ── */}
          {activeTab === 'notifications' && (
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-surface-900 dark:text-white">Notification Preferences</h2>
              {prefs ? (
                <div className="space-y-1">
                  {Object.entries(prefs).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-2.5 border-b border-surface-100 dark:border-surface-800 last:border-0">
                      <p className="text-sm text-surface-700 dark:text-surface-300 capitalize">{key.replace(/_/g, ' ')}</p>
                      <button
                        onClick={() => prefMutation.mutate({ ...prefs, [key]: !value })}
                        className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-primary-600' : 'bg-surface-300'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-surface-400">Loading preferences...</p>
              )}
            </div>
          )}

          {/* ── SESSIONS TAB ── */}
          {activeTab === 'sessions' && (
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-surface-900 dark:text-white">Active Sessions</h2>
              <p className="text-sm text-surface-500">These devices are currently signed in to your account.</p>
              <div className="space-y-2">
                {(sessions || []).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-100 dark:border-surface-700">
                    <div className="flex items-center gap-3">
                      {s.device_type === 'mobile'
                        ? <Smartphone size={18} className="text-surface-400 flex-shrink-0" />
                        : <Monitor size={18} className="text-surface-400 flex-shrink-0" />}
                      <div>
                        <p className="text-sm font-medium text-surface-900 dark:text-white">
                          {s.device_name || s.device_type || 'Unknown device'}
                        </p>
                        <p className="text-xs text-surface-500 flex items-center gap-1">
                          {s.ip_address && <span>{s.ip_address} ·</span>}
                          <Clock size={10} />
                          {formatDistanceToNow(new Date(s.last_used_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => revokeSessionMutation.mutate(s.id)}
                      className="btn-ghost p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {sessions?.length === 0 && (
                  <p className="text-sm text-surface-400 text-center py-4">No active sessions found</p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
