import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UiState {
  darkMode: boolean
  sidebarOpen: boolean
  mobileSidebarOpen: boolean
  commandPaletteOpen: boolean
  activeModal: string | null
}

const initialState: UiState = {
  darkMode: localStorage.getItem('darkMode') === 'true',
  sidebarOpen: true,
  mobileSidebarOpen: false,
  commandPaletteOpen: false,
  activeModal: null,
}

// Apply dark mode class on load
if (initialState.darkMode) document.documentElement.classList.add('dark')

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode(state) {
      state.darkMode = !state.darkMode
      localStorage.setItem('darkMode', String(state.darkMode))
      document.documentElement.classList.toggle('dark', state.darkMode)
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) { state.sidebarOpen = action.payload },
    toggleMobileSidebar(state) { state.mobileSidebarOpen = !state.mobileSidebarOpen },
    closeMobileSidebar(state) { state.mobileSidebarOpen = false },
    setCommandPalette(state, action: PayloadAction<boolean>) { state.commandPaletteOpen = action.payload },
    openModal(state, action: PayloadAction<string>) { state.activeModal = action.payload },
    closeModal(state) { state.activeModal = null },
  },
})

export const { toggleDarkMode, setSidebarOpen, toggleMobileSidebar, closeMobileSidebar, setCommandPalette, openModal, closeModal } = uiSlice.actions
export default uiSlice.reducer
