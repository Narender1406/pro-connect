import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { updateUser } from '../../store/slices/authSlice'
import { userService } from '../../services'
import { useMutation } from '@tanstack/react-query'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Avatar from '../../components/ui/Avatar'
import toast from 'react-hot-toast'
import { Camera, Plus, Trash2, ArrowLeft } from 'lucide-react'
import type { Skill, Experience, Education, PortfolioLink } from '../../types'

export default function EditProfilePage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector(s => s.auth)

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    headline: user?.headline || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    github_username: user?.github_username || '',
    linkedin_url: user?.linkedin_url || '',
    open_to_work: user?.open_to_work || false,
  })

  const [skills, setSkills] = useState<Skill[]>([])
  const [newSkill, setNewSkill] = useState('')

  const updateMutation = useMutation({
    mutationFn: () => userService.updateProfile({ ...form, skills }),
    onSuccess: (r) => {
      dispatch(updateUser(r.data.profile))
      toast.success('Profile updated!')
      navigate(`/profile/${user?.username}`)
    },
  })

  const avatarMutation = useMutation({
    mutationFn: (file: File) => userService.uploadAvatar(file),
    onSuccess: (r) => { dispatch(updateUser({ avatar_url: r.data.avatar_url })); toast.success('Avatar updated!') },
  })

  const addSkill = () => {
    if (!newSkill.trim()) return
    setSkills(s => [...s, { name: newSkill.trim(), level: 'intermediate', years: undefined, endorsed_by: [] }])
    setNewSkill('')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-bold text-surface-900 dark:text-white">Edit Profile</h1>
      </div>

      {/* Avatar */}
      <div className="card p-6">
        <h2 className="font-semibold text-surface-900 dark:text-white mb-4">Profile Photo</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar user={user} size="xl" />
            <label className="absolute bottom-0 right-0 w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
              <Camera size={13} className="text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={e => {
                const file = e.target.files?.[0]
                if (file) avatarMutation.mutate(file)
              }} />
            </label>
          </div>
          <div>
            <p className="text-sm font-medium text-surface-900 dark:text-white">{user?.full_name}</p>
            <p className="text-xs text-surface-500">JPG, PNG up to 10MB</p>
          </div>
        </div>
      </div>

      {/* Basic info */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-surface-900 dark:text-white">Basic Information</h2>
        <Input label="Full Name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
        <Input label="Headline" placeholder="e.g. Senior React Developer at Acme" value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} />
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Bio</label>
          <textarea className="input resize-none" rows={4} placeholder="Tell people about yourself..." value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Location" placeholder="City, Country" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          <Input label="Website" placeholder="https://yoursite.com" type="url" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="GitHub Username" placeholder="yourusername" value={form.github_username} onChange={e => setForm(f => ({ ...f, github_username: e.target.value }))} />
          <Input label="LinkedIn URL" placeholder="https://linkedin.com/in/..." value={form.linkedin_url} onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-surface-700 dark:text-surface-300">Open to work</p>
            <p className="text-xs text-surface-400">Show recruiters you're available</p>
          </div>
          <button onClick={() => setForm(f => ({ ...f, open_to_work: !f.open_to_work }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.open_to_work ? 'bg-primary-600' : 'bg-surface-300'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${form.open_to_work ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Skills */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-surface-900 dark:text-white">Skills</h2>
        <div className="flex gap-2">
          <Input placeholder="Add a skill..." value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill()} />
          <Button variant="secondary" onClick={addSkill} icon={<Plus size={14} />}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, i) => (
            <span key={i} className="badge-primary flex items-center gap-1.5 px-2.5 py-1">
              {skill.name}
              <button onClick={() => setSkills(s => s.filter((_, idx) => idx !== i))} className="hover:text-red-500">
                <Trash2 size={12} />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" fullWidth onClick={() => navigate(-1)}>Cancel</Button>
        <Button fullWidth loading={updateMutation.isPending} onClick={() => updateMutation.mutate()}>Save Changes</Button>
      </div>
    </div>
  )
}
