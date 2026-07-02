import { useCallback, useRef } from 'react'

export function useDebounce<T extends (...args: Parameters<T>) => ReturnType<T>>(fn: T, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  return useCallback((...args: Parameters<T>) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(...args), delay)
  }, [fn, delay])
}
