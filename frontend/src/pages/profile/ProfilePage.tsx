import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '../../services'
import { useAppSelector } from '../../store/hooks'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import { Globe, Github, Linkedin, MapPin, Link2, FileText, Edit, UserCheck, UserPlus, Briefcase, GraduationCap, Code2, ExternalLink, Calendar } from 'lucide-react'
import { useState } from 'react'
import type { UserProfile } from '../../types'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'

const skillLevelColors = { beginner: 'badge-gray', intermediate: 'badge-primary', advanced: 'badge-warning', expert: 'bg-purple-100 text-purple-700 badge' }

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user: me } = useAppSelector(s => s.auth)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'skills' | 'experience'>('about')

  const { data, isLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => userService.getProfile(username!).then(r => r.data.profile as UserProfile),
  })

  const followMutation = useMutation({
    mutationFn: () => data?.is_following ? userService.unfollowUser(data.id) : userService.followUser(data!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', username] }),
  })

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary-500" /></div>
  if (!data) return <div className="flex justify-center py-20 text-surface-500">User not found</div>

  const isMe = me?.id === data.id

  return (
    <div className="max-w-4xl mx-auto">
      {/* Cover */}
      <div className="relative h-48 bg-gradient-to-br from-primary-500 to-primary-700 overflow-hidden">
        {data.cover_url && <img src={data.cover_url} alt="Cover" className="w-full h-full object-cover" />}
      </div>

      {/* Profile header */}
      <div className="px-6 pb-4 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800">
        <div className="flex items-end justify-between -mt-12 mb-4">
          <div className="relative">
            <Avatar user={data} size="xl" className="ring-4 ring-white dark:ring-surface-900 w-24 h-24" />
            {data.open_to_work && (
              <span className="absolute bottom-1 right-0 badge bg-green-500 text-white text-[10px] py-0.5 px-1.5 rounded-full">Open to work</span>
            )}
          </div>
          <div className="flex gap-2 pb-2">
            {isMe ? (
              <Button variant="secondary" size="sm" onClick={() => navigate('/profile/edit')} icon={<Edit size={14} />}>
                Edit Profile
              </Button>
            ) : (
              <>
                <Button
                  variant={data.is_following ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => followMutation.mutate()}
                  loading={followMutation.isPending}
                  icon={data.is_following ? <UserCheck size={14} /> : <UserPlus size={14} />}
                >
                  {data.is_following ? 'Following' : 'Follow'}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => navigate('/chat')}>Message</Button>
              </>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{data.full_name}</h1>
          <p className="text-surface-500 text-sm">@{data.username}</p>
          {data.headline && <p className="text-surface-700 dark:text-surface-300 mt-1">{data.headline}</p>}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-surface-500">
            {data.location && <span className="flex items-center gap-1"><MapPin size={14} />{data.location}</span>}
            {data.website && <a href={data.website} target="_blank" className="flex items-center gap-1 hover:text-primary-600"><Globe size={14} />{data.website.replace(/^https?:\/\//, '')}</a>}
            {data.github_username && <a href={`https://github.com/${data.github_username}`} target="_blank" className="flex items-center gap-1 hover:text-primary-600"><Github size={14} />/{data.github_username}</a>}
            {data.linkedin_url && <a href={data.linkedin_url} target="_blank" className="flex items-center gap-1 hover:text-primary-600"><Linkedin size={14} />LinkedIn</a>}
            {data.resume_url && <a href={data.resume_url} target="_blank" className="flex items-center gap-1 hover:text-primary-600"><FileText size={14} />Resume</a>}
          </div>

          <div className="flex gap-6 mt-3 text-sm">
            <button className="text-surface-700 dark:text-surface-300 hover:text-primary-600">
              <span className="font-bold">{data.followers_count}</span> <span className="text-surface-500">followers</span>
            </button>
            <button className="text-surface-700 dark:text-surface-300 hover:text-primary-600">
              <span className="font-bold">{data.following_count}</span> <span className="text-surface-500">following</span>
            </button>
            <span className="text-surface-700 dark:text-surface-300">
              <span className="font-bold">{data.posts_count}</span> <span className="text-surface-500">posts</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 px-6">
        <div className="flex gap-0">
          {(['about', 'skills', 'experience', 'posts'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-900 dark:hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-6 space-y-4">
        {activeTab === 'about' && (
          <div className="space-y-4">
            {data.bio && (
              <div className="card p-4">
                <h3 className="font-semibold text-surface-900 dark:text-white mb-2">About</h3>
                <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">{data.bio}</p>
              </div>
            )}
            {data.portfolio_links.length > 0 && (
              <div className="card p-4">
                <h3 className="font-semibold text-surface-900 dark:text-white mb-3">Portfolio</h3>
                <div className="space-y-2">
                  {data.portfolio_links.map((link, i) => (
                    <a key={i} href={link.url} target="_blank" className="flex items-center gap-2 text-sm text-primary-600 hover:underline">
                      <ExternalLink size={14} />{link.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'skills' && data.skills.length > 0 && (
          <div className="card p-4">
            <h3 className="font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2"><Code2 size={16} />Skills</h3>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill, i) => (
                <span key={i} className={`${skillLevelColors[skill.level]} text-sm px-3 py-1`}>
                  {skill.name} {skill.years ? `· ${skill.years}y` : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'experience' && (
          <div className="space-y-3">
            {data.experience.length > 0 && (
              <div className="card p-4">
                <h3 className="font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2"><Briefcase size={16} />Experience</h3>
                <div className="space-y-4">
                  {data.experience.map((exp, i) => (
                    <div key={i} className={i > 0 ? 'pt-4 border-t border-surface-100 dark:border-surface-700' : ''}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-surface-900 dark:text-white text-sm">{exp.title}</h4>
                          <p className="text-sm text-primary-600 dark:text-primary-400">{exp.company}</p>
                          <p className="text-xs text-surface-500">{exp.start_date} — {exp.current ? 'Present' : exp.end_date} {exp.location && `· ${exp.location}`}</p>
                        </div>
                      </div>
                      {exp.description && <p className="text-sm text-surface-600 dark:text-surface-400 mt-2 leading-relaxed">{exp.description}</p>}
                      {exp.skills_used.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {exp.skills_used.map(s => <span key={s} className="badge-gray text-xs">{s}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.education.length > 0 && (
              <div className="card p-4">
                <h3 className="font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2"><GraduationCap size={16} />Education</h3>
                <div className="space-y-3">
                  {data.education.map((edu, i) => (
                    <div key={i} className={i > 0 ? 'pt-3 border-t border-surface-100 dark:border-surface-700' : ''}>
                      <h4 className="font-semibold text-surface-900 dark:text-white text-sm">{edu.institution}</h4>
                      <p className="text-sm text-surface-600 dark:text-surface-400">{edu.degree} in {edu.field}</p>
                      <p className="text-xs text-surface-500">{edu.start_year} — {edu.end_year || 'Present'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
