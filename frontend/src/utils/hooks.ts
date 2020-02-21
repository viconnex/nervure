import { useEffect, useRef } from 'react'

export const useInterval = <T>(callback: () => T, delay: number | null): void => {
  const ref = useRef<() => T>(callback)

  useEffect(() => {
    ref.current = callback
  }, [callback])

  useEffect(() => {
    if (null !== delay) {
      const interval = setInterval(() => {
        ref.current()
      }, delay)

      return (): void => clearInterval(interval)
    }
  }, [delay])
}
