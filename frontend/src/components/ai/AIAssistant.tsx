import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { aiService } from '../../services/aiService'
import { Bot, Send, Sparkles, User, Loader2, RefreshCw } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STARTERS = [
  'Help me write a post about my recent project',
  'Review my career path and give advice',
  'Suggest tasks for a new web app project',
  'Help me prepare for a technical interview',
]

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const mutation = useMutation({
    mutationFn: ({ message, history }: { message: string; history: Message[] }) =>
      aiService.chat(message, history).then(r => r.data.reply as string),
    onSuccess: (reply) => {
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    },
    onError: () => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }])
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    const msg = input.trim()
    if (!msg || mutation.isPending) return
    const updated = [...messages, { role: 'user' as const, content: msg }]
    setMessages(updated)
    setInput('')
    mutation.mutate({ message: msg, history: messages })
  }

  const reset = () => setMessages([])

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-surface-900 dark:text-white">AI Assistant</h2>
            <p className="text-xs text-surface-500">Powered by AI</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={reset} className="btn-ghost flex items-center gap-1.5 text-sm">
            <RefreshCw size={14} /> New chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bot size={32} className="text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">How can I help you?</h3>
            <p className="text-surface-500 text-sm mb-6">Ask me anything about your career, posts, or projects.</p>
            <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
              {STARTERS.map(s => (
                <button key={s} onClick={() => setInput(s)}
                  className="text-left p-3 text-sm bg-surface-50 dark:bg-surface-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-surface-700 dark:text-surface-300 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <Sparkles size={14} className="text-white" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-primary-600 text-white rounded-tr-sm'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white rounded-tl-sm'
              }`}>
                {m.content}
              </div>
              {m.role === 'user' && (
                <div className="w-8 h-8 bg-surface-200 dark:bg-surface-700 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <User size={14} className="text-surface-600 dark:text-surface-400" />
                </div>
              )}
            </div>
          ))
        )}
        {mutation.isPending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="bg-surface-100 dark:bg-surface-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 size={16} className="animate-spin text-primary-500" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-4 border-t border-surface-200 dark:border-surface-800">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Ask the AI assistant..."
          className="input flex-1"
          disabled={mutation.isPending}
        />
        <button onClick={send} disabled={!input.trim() || mutation.isPending}
          className="btn-primary px-4 flex items-center gap-2">
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
