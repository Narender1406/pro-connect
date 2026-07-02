import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  date: Date
  color: string
  type: 'task' | 'meeting' | 'deadline'
}

const SAMPLE_EVENTS: CalendarEvent[] = [
  { id: '1', title: 'Team standup', date: new Date(), color: 'bg-blue-500', type: 'meeting' },
  { id: '2', title: 'Project deadline', date: new Date(Date.now() + 86400000 * 3), color: 'bg-red-500', type: 'deadline' },
  { id: '3', title: 'Code review', date: new Date(Date.now() + 86400000 * 5), color: 'bg-green-500', type: 'task' },
]

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startDay = startOfMonth(currentMonth).getDay()
  const getEventsForDay = (day: Date) => SAMPLE_EVENTS.filter(e => isSameDay(e.date, day))
  const selectedEvents = selectedDate ? getEventsForDay(selectedDate) : []

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Calendar</h1>
        <button className="btn-primary btn-sm flex items-center gap-1.5"><Plus size={14} /> New Event</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-surface-900 dark:text-white text-lg">{format(currentMonth, 'MMMM yyyy')}</h2>
            <div className="flex gap-1">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="btn-ghost p-2 rounded-lg"><ChevronLeft size={16} /></button>
              <button onClick={() => setCurrentMonth(new Date())} className="btn-secondary btn-sm">Today</button>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="btn-ghost p-2 rounded-lg"><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-surface-400 py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} />)}
            {days.map(day => {
              const events = getEventsForDay(day)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const todayDay = isToday(day)
              return (
                <button key={day.toISOString()} onClick={() => setSelectedDate(day)}
                  className={`relative p-2 rounded-xl text-sm transition-all min-h-[52px] flex flex-col items-center ${isSelected ? 'bg-primary-600 text-white' : todayDay ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-bold' : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300'}`}>
                  <span>{format(day, 'd')}</span>
                  {events.length > 0 && (
                    <div className="flex gap-0.5 mt-1">
                      {events.slice(0, 3).map(e => <div key={e.id} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : e.color}`} />)}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
            {selectedDate ? format(selectedDate, 'EEEE, MMM d') : 'Select a date'}
          </h3>
          {selectedEvents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-surface-400">No events this day</p>
              <button className="link text-sm mt-2">+ Add event</button>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map(e => (
                <div key={e.id} className="flex items-start gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-xl">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${e.color}`} />
                  <div>
                    <p className="text-sm font-medium text-surface-900 dark:text-white">{e.title}</p>
                    <p className="text-xs text-surface-500 capitalize">{e.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
