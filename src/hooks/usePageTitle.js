import { useEffect } from 'react'

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Remembering Jamie` : 'Remembering Jamie'
    return () => { document.title = 'Remembering Jamie' }
  }, [title])
}
