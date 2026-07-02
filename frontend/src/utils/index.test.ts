import { describe, it, expect } from 'vitest'
import { cn, formatNumber, getInitials, truncate, slugify } from './index'

describe('cn (class merging)', () => {
  it('merges class names', () => { expect(cn('foo', 'bar')).toBe('foo bar') })
  it('handles conditional classes', () => { expect(cn('base', false && 'hidden', 'shown')).toBe('base shown') })
  it('deduplicates tailwind classes', () => { expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500') })
})

describe('formatNumber', () => {
  it('formats numbers below 1000 as-is', () => { expect(formatNumber(999)).toBe('999') })
  it('formats thousands with K', () => { expect(formatNumber(1500)).toBe('1.5K') })
  it('formats millions with M', () => { expect(formatNumber(2_500_000)).toBe('2.5M') })
})

describe('getInitials', () => {
  it('returns 2 initials from full name', () => { expect(getInitials('John Doe')).toBe('JD') })
  it('returns 1 initial for single name', () => { expect(getInitials('Alice')).toBe('A') })
  it('returns max 2 initials', () => { expect(getInitials('John Michael Doe')).toBe('JM') })
})

describe('truncate', () => {
  it('returns string as-is if within limit', () => { expect(truncate('hello', 10)).toBe('hello') })
  it('truncates with ellipsis if over limit', () => { expect(truncate('hello world', 5)).toBe('hello…') })
})

describe('slugify', () => {
  it('converts to lowercase slug', () => { expect(slugify('Hello World')).toBe('hello-world') })
  it('removes special chars', () => { expect(slugify('Hello, World!')).toBe('hello-world') })
})
