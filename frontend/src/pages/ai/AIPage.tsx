import { useState, useRef, useEffect } from 'react'
import { Send, Bot, Loader2, Sparkles, FileText, MessageSquare, ClipboardList } from 'lucide-react'

interface Message { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  { icon: FileText, label: 'Review my resume', prompt: 'Please review my resume and give feedback for software engineering roles.' },
  { icon: MessageSquare, label: 'Write a post', prompt: 'Help me write a professional post about a recent project I completed.' },
  { icon: ClipboardList, label: 'Suggest tasks', prompt: 'I am building a SaaS product. Suggest tasks I should add to my project board.' },
  { icon: Sparkles, label: 'Career advice', prompt: 'What skills should a senior frontend developer have in 2025?' },
]

const AI_REPLIES: Record<string, string> = {
  resume: 'Great question! For a strong software engineering resume: 1) Lead with a concise summary highlighting your stack and years of experience. 2) Quantify achievements (e.g. "reduced load time by 40%"). 3) List relevant skills prominently. 4) Keep it to 1-2 pages. 5) Tailor keywords to each job description.',
  post: 'Here\'s a post template:\n\n🚀 Just shipped [Project Name]!\n\nThe challenge: [problem you solved]\nThe solution: [what you built]\nThe result: [measurable outcome]\n\nKey learnings:\n• [insight 1]\n• [insight 2]\n• [insight 3]\n\nWhat\'s your biggest engineering win this month? 👇\n\n#buildinpublic #softwareengineering #webdev',
  tasks: 'Here are suggested tasks for your SaaS project:\n\n**Discovery**\n• Define target user personas\n• Competitive analysis\n\n**MVP**\n• Set up auth (login/register)\n• Core feature implementation\n• Basic dashboard UI\n\n**Launch**\n• Landing page\n• Onboarding flow\n• Error monitoring setup\n• Analytics integration',
  career: 'Top skills for a senior frontend developer in 2025:\n\n**Core**: React/Vue/Angular, TypeScript, CSS architecture\n**Performance**: Core Web Vitals, bundle optimization, lazy loading\n**Testing**: Vitest, Playwright, Testing Library\n**Architecture**: Micro-frontends, design systems, state management\n**Soft skills**: Technical leadership, code review, mentoring\n\nBonus: AI/LLM integration experience is increasingly valuable.',
  default: 'I\'m your CareerTrack AI assistant! I can help with:\n• ✍️ Writing professional posts\n• 📄 Resume review & optimization\n• 📋 Project task suggestions\n• 🎯 Career path guidance\n• 📝 Meeting summaries\n\nWhat would you like help with today?',
}

function getReply(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('resume') || t.includes('cv')) return AI_REPLIES.resume
  if (t.includes('post') || t.includes('write') || t.includes('linkedin')) return AI_REPLIES.post
  if (t.includes('task') || t.includes('saas') || t.includes('project')) return AI_REPLIES.tasks
  if (t.includes('skill') || t.includes('career') || t.includes('developer')) return AI_REPLIES.career
  return AI_REPLIES.default
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m your CareerTrack AI assistant. I can help you write posts, review your resume, suggest tasks, and give career advice. What can I help you with today?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    setMessages(prev => [...prev, { role: 'assistant', content: getReply(text) }])
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-3xl mx-auto">
      <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-800 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
          <Sparkles size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-surface-900 dark:text-white">AI Assistant</h1>
          <p className="text-xs text-surface-500">Career coaching, post writing, task suggestions</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-gradient-to-br from-primary-500 to-purple-600' : 'bg-surface-200 dark:bg-surface-700'}`}>
              {msg.role === 'assistant' ? <Bot size={15} className="text-white" /> : <span className="text-xs font-bold text-surface-600 dark:text-surface-300">You</span>}
            </div>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'assistant' ? 'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200 rounded-tl-sm' : 'bg-primary-600 text-white rounded-tr-sm'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Bot size={15} className="text-white" />
            </div>
            <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
              {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length === 1 && (
        <div className="px-4 pb-2 grid grid-cols-2 gap-2">
          {SUGGESTIONS.map(s => (
            <button key={s.label} onClick={() => sendMessage(s.prompt)}
              className="card-hover p-3 text-left flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              <s.icon size={15} className="text-primary-500 flex-shrink-0" />
              {s.label}
            </button>
          ))}
        </div>
      )}

      <div className="px-4 py-3 border-t border-surface-200 dark:border-surface-800 flex-shrink-0">
        <div className="flex gap-2">
          <input className="input flex-1 text-sm" placeholder="Ask me anything about your career..."
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            disabled={loading} />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading} className="btn-primary px-3">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
