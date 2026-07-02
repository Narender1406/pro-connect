import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'

// UI store - replaces uiSlice for local UI state
interface UIStore {
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  commandOpen: boolean
  activeModal: string | null
  searchQuery: string
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  setCommandOpen: (v: boolean) => void
  openModal: (id: string) => void
  closeModal: () => void
  setSearchQuery: (q: string) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    subscribeWithSelector((set) => ({
      theme: 'system',
      sidebarCollapsed: false,
      commandOpen: false,
      activeModal: null,
      searchQuery: '',
      setTheme: (theme) => {
        set({ theme })
        const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.classList.toggle('dark', isDark)
      },
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setCommandOpen: (v) => set({ commandOpen: v }),
      openModal: (id) => set({ activeModal: id }),
      closeModal: () => set({ activeModal: null }),
      setSearchQuery: (q) => set({ searchQuery: q }),
    })),
    { name: 'careertrack-ui' }
  )
)

// Onboarding / tour state
interface OnboardingStore {
  completed: boolean
  currentStep: number
  setCompleted: () => void
  nextStep: () => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      completed: false,
      currentStep: 0,
      setCompleted: () => set({ completed: true }),
      nextStep: () => set((s) => ({ currentStep: s.currentStep + 1 })),
      reset: () => set({ completed: false, currentStep: 0 }),
    }),
    { name: 'careertrack-onboarding' }
  )
)

// Feed filter state
interface FeedStore {
  filter: 'all' | 'following' | 'trending'
  postType: string | null
  setFilter: (f: 'all' | 'following' | 'trending') => void
  setPostType: (t: string | null) => void
}

export const useFeedStore = create<FeedStore>()((set) => ({
  filter: 'all',
  postType: null,
  setFilter: (filter) => set({ filter }),
  setPostType: (postType) => set({ postType }),
}))

// Active workspace / project state
interface WorkspaceStore {
  activeWorkspaceId: string | null
  activeProjectId: string | null
  setActiveWorkspace: (id: string | null) => void
  setActiveProject: (id: string | null) => void
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      activeWorkspaceId: null,
      activeProjectId: null,
      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
      setActiveProject: (id) => set({ activeProjectId: id }),
    }),
    { name: 'careertrack-workspace' }
  )
)
