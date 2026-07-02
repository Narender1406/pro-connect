import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { User } from '../../types'
import { authService } from '../../services/authService'
import { tokenStorage } from '../../utils/tokenStorage'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
}

// Migrate legacy localStorage tokens on startup
tokenStorage.migrate()

export const initAuth = createAsyncThunk('auth/init', async () => {
  const token = tokenStorage.getAccessToken()
  if (!token) return null
  const { data } = await authService.getMe()
  return data.user
})

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string; totp_code?: string }, { rejectWithValue }) => {
    try {
      const { data } = await authService.login(credentials)
      tokenStorage.setAccessToken(data.access_token)
      tokenStorage.setRefreshToken(data.refresh_token)
      return data.user
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error?.message || 'Login failed')
    }
  }
)

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  const rt = tokenStorage.getRefreshToken()
  if (rt) await authService.logout(rt).catch(() => {})
  tokenStorage.clear()
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens(state, action: PayloadAction<{ access_token: string; refresh_token: string }>) {
      tokenStorage.setAccessToken(action.payload.access_token)
      tokenStorage.setRefreshToken(action.payload.refresh_token)
    },
    logout(state) {
      state.user = null
      state.isAuthenticated = false
      tokenStorage.clear()
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) state.user = { ...state.user, ...action.payload }
    },
    clearError(state) { state.error = null },
  },
  extraReducers: builder => {
    builder
      .addCase(initAuth.pending, state => { state.loading = true })
      .addCase(initAuth.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = !!action.payload
      })
      .addCase(initAuth.rejected, state => {
        state.loading = false
        state.isAuthenticated = false
        tokenStorage.clear()
      })
      .addCase(loginUser.pending, state => { state.loading = true; state.error = null })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(logoutUser.fulfilled, state => {
        state.user = null
        state.isAuthenticated = false
      })
  },
})

export const { setTokens, logout, updateUser, clearError } = authSlice.actions
export default authSlice.reducer
