import { useEffect, useRef, useState } from 'react'

/**
 * State that mirrors itself into localStorage. Reads are lazy (once, on mount)
 * and every write is wrapped — private-mode browsers and blocked site data
 * throw on access, and the app should keep working when they do.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw === null) return initialValue
      return JSON.parse(raw)
    } catch {
      return initialValue
    }
  })

  const keyRef = useRef(key)
  keyRef.current = key

  useEffect(() => {
    try {
      window.localStorage.setItem(keyRef.current, JSON.stringify(value))
    } catch {
      /* storage unavailable or full — the session simply won't persist */
    }
  }, [value])

  // Keep two open tabs of the app in sync.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== keyRef.current || event.newValue === null) return
      try {
        setValue(JSON.parse(event.newValue))
      } catch {
        /* ignore malformed payloads from another tab */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return [value, setValue]
}
