import { describe, it, expect, beforeEach } from 'vitest'
import { tokenStorage } from './tokenStorage'

describe('tokenStorage', () => {
  beforeEach(() => { tokenStorage.clear() })

  it('stores and retrieves access token', () => {
    tokenStorage.setAccessToken('test-access-token')
    expect(tokenStorage.getAccessToken()).toBe('test-access-token')
  })

  it('stores and retrieves refresh token', () => {
    tokenStorage.setRefreshToken('test-refresh-token')
    expect(tokenStorage.getRefreshToken()).toBe('test-refresh-token')
  })

  it('clears all tokens', () => {
    tokenStorage.setAccessToken('at')
    tokenStorage.setRefreshToken('rt')
    tokenStorage.clear()
    expect(tokenStorage.getAccessToken()).toBeNull()
    expect(tokenStorage.getRefreshToken()).toBeNull()
  })

  it('migrate is a no-op (tokens stay in localStorage)', () => {
    localStorage.setItem('access_token', 'legacy-at')
    tokenStorage.migrate()
    expect(tokenStorage.getAccessToken()).toBe('legacy-at')
  })
})
