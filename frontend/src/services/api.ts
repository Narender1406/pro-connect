import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'
import { tokenStorage } from '../utils/tokenStorage'

// Lazy store import to break circular dependency:
// api.ts → store/index.ts → authSlice.ts → authService.ts → api.ts
const getStore = () => import('../store').then(m => m.store)

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
  withCredentials: true, // send cookies (for future httpOnly cookie support)
})

// CSRF token helper — reads from meta tag or cookie
function getCsrfToken(): string | null {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
  if (meta) return meta.content
  const match = document.cookie.match(/csrf_token=([^;]+)/)
  return match ? match[1] : null
}

// Request interceptor — attach access token + CSRF header
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`

  // Add CSRF header for state-changing methods
  const method = config.method?.toUpperCase()
  if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrf = getCsrfToken()
    if (csrf) config.headers['X-CSRF-Token'] = csrf
  }

  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

const processQueue = (error: unknown, token?: string) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token!))
  failedQueue = []
}

// Response interceptor — handle 401 and token refresh
api.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }
      original._retry = true
      isRefreshing = true
      const refreshToken = tokenStorage.getRefreshToken()
      if (!refreshToken) {
        getStore().then(s => s.dispatch(({ type: 'auth/logout' })))
        return Promise.reject(error)
      }
      try {
        const { data } = await axios.post('/api/v1/auth/refresh', { refresh_token: refreshToken })
        const s = await getStore()
        s.dispatch({ type: 'auth/setTokens', payload: { access_token: data.access_token, refresh_token: data.refresh_token } })
        processQueue(null, data.access_token)
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch (err) {
        processQueue(err)
        getStore().then(s => s.dispatch({ type: 'auth/logout' }))
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    const msg = (error.response?.data as any)?.error?.message || 'An error occurred'
    if (error.response?.status !== 401) toast.error(msg)
    return Promise.reject(error)
  }
)

export default api
