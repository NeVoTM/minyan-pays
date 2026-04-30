import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type PunchHeaderContextValue = {
  punchInHeaderTitle: string | null
  setPunchInHeaderTitle: (title: string | null) => void
}

const PunchHeaderContext = createContext<PunchHeaderContextValue | null>(null)

export function PunchHeaderProvider({ children }: { children: ReactNode }) {
  const [punchInHeaderTitle, setPunchInHeaderTitle] = useState<string | null>(
    null
  )
  const value = useMemo(
    () => ({ punchInHeaderTitle, setPunchInHeaderTitle }),
    [punchInHeaderTitle]
  )
  return (
    <PunchHeaderContext.Provider value={value}>
      {children}
    </PunchHeaderContext.Provider>
  )
}

export function usePunchHeader() {
  const ctx = useContext(PunchHeaderContext)
  if (!ctx) {
    throw new Error('usePunchHeader must be used within PunchHeaderProvider')
  }
  return ctx
}
