import type { ReactNode } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface AppLayoutProps {
  title: string
  children: ReactNode
}

export function AppLayout({ title, children }: AppLayoutProps) {
  const { theme } = useTheme()

  return (
    <div
      className="flex min-h-screen transition-colors duration-200"
      style={{ background: theme === 'dark' ? '#0a0d14' : '#f1f5f9' }}
    >
      <Sidebar />
      <div className="flex-1 ml-56 flex flex-col min-h-screen">
        <Topbar title={title} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
