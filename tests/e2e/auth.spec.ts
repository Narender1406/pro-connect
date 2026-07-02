import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Welcome back')).toBeVisible()
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('shows validation errors on empty submit', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByText(/Invalid email|required/i)).toBeVisible()
  })

  test('navigates to register page', async ({ page }) => {
    await page.goto('/login')
    await page.getByText('Create one free').click()
    await expect(page).toHaveURL('/register')
  })

  test('navigates to forgot password', async ({ page }) => {
    await page.goto('/login')
    await page.getByText('Forgot password?').click()
    await expect(page).toHaveURL('/forgot-password')
  })
})

test.describe('Registration Flow', () => {
  test('register page renders correctly', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByText('Create your account')).toBeVisible()
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible()
  })

  test('shows password strength validation', async ({ page }) => {
    await page.goto('/register')
    await page.getByPlaceholder(/password/i).first().fill('weak')
    await page.getByRole('button', { name: /create account/i }).click()
    await expect(page.getByText(/at least 8/i)).toBeVisible()
  })
})

test.describe('Protected Routes', () => {
  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/feed')
    await expect(page).toHaveURL('/login')
  })

  test('redirects to login from profile', async ({ page }) => {
    await page.goto('/profile/alice')
    await expect(page).toHaveURL('/login')
  })
})
