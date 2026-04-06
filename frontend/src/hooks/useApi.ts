import { useCallback, useEffect, useRef, useState } from 'react'

interface State<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null })
  const mounted = useRef(true)

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await fetcher()
      if (mounted.current) setState({ data, loading: false, error: null })
    } catch (e) {
      if (mounted.current)
        setState({ data: null, loading: false, error: (e as Error).message })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    mounted.current = true
    run()
    return () => { mounted.current = false }
  }, [run])

  return { ...state, refetch: run }
}

export function useLazyApi<TArgs extends unknown[], TResult>(
  fetcher: (...args: TArgs) => Promise<TResult>,
) {
  const [state, setState] = useState<State<TResult>>({ data: null, loading: false, error: null })

  const execute = useCallback(
    async (...args: TArgs) => {
      setState({ data: null, loading: true, error: null })
      try {
        const data = await fetcher(...args)
        setState({ data, loading: false, error: null })
        return data
      } catch (e) {
        setState({ data: null, loading: false, error: (e as Error).message })
        return null
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return { ...state, execute }
}
