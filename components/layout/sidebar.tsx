'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Dumbbell,
  Salad,
  TrendingUp,
  Settings,
  ChevronRight,
  LogOut,
  Calculator,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTheme } from '@/components/providers/theme-provider'

const STORAGE_KEY = 'alifit-sidebar-collapsed'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    href: '/training',
    label: 'Training',
    icon: Dumbbell,
    children: [
      { href: '/training/plan', label: 'Plan' },
      { href: '/training/log', label: 'Log Workout' },
      { href: '/training/analytics', label: 'Analytics' },
      { href: '/training/deload', label: 'Deload Tracker' },
    ],
  },
  {
    href: '/nutrition',
    label: 'Nutrition',
    icon: Salad,
    children: [
      { href: '/nutrition/meals', label: 'Meal Plan' },
      { href: '/nutrition/log', label: 'Calorie Log' },
      { href: '/nutrition/analytics', label: 'Analytics' },
      { href: '/nutrition/calculator', label: 'Calculator' },
    ],
  },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved !== null) setCollapsed(saved === 'true')
    } catch {
      // localStorage unavailable in some environments
    }
  }, [])

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem(STORAGE_KEY, String(next)) } catch { /* ignore */ }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col min-h-screen bg-sidebar border-r border-sidebar-border shrink-0',
        'transition-[width] duration-300 ease-in-out overflow-hidden',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* ── Header / logo ── */}
      <div className="flex items-center justify-between p-3 h-16 border-b border-sidebar-border">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 px-1 overflow-hidden">
            <Dumbbell className="h-5 w-5 text-primary shrink-0" />
            <span className="font-bold text-base tracking-tight truncate">AliFit</span>
          </Link>
        )}
        <button
          onClick={toggleCollapsed}
          className={cn(
            'flex items-center justify-center rounded-lg p-1.5 text-sidebar-foreground/50',
            'hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors',
            collapsed ? 'mx-auto' : 'ml-auto',
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          const hasChildren = !!item.children?.length
          // Collapsed: navigate to first child if available, else self
          const primaryHref =
            hasChildren ? (item.children![0].href) : item.href

          return (
            <div key={item.href}>
              <Link
                href={primaryHref}
                className={cn(
                  'flex items-center gap-3 rounded-lg text-sm font-medium transition-colors',
                  'px-3 py-2',
                  collapsed && 'justify-center px-0 w-full',
                  isActive
                    ? 'bg-sidebar-accent text-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 whitespace-nowrap">{item.label}</span>
                    {hasChildren && (
                      <ChevronRight className="h-3 w-3 opacity-50" />
                    )}
                  </>
                )}
              </Link>

              {/* Sub-items -- only when expanded and parent is active */}
              {!collapsed && hasChildren && isActive && (
                <div className="ml-7 mt-0.5 space-y-0.5 pb-1">
                  {item.children!.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        'block px-3 py-1.5 rounded-md text-xs transition-colors',
                        pathname === child.href
                          ? 'text-primary font-medium'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Calorie calculator shortcut */}
        <Link
          href="/calculator"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
            'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors',
            collapsed && 'justify-center px-0 w-full',
          )}
          title={collapsed ? 'Calorie Calc' : undefined}
        >
          <Calculator className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">Calorie Calc</span>}
        </Link>
      </nav>

      {/* ── Footer ── */}
      <div className="p-2 border-t border-sidebar-border space-y-0.5">
        <button
          onClick={toggleTheme}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm',
            'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground w-full transition-colors',
            collapsed && 'justify-center px-0',
          )}
          title={collapsed ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : undefined}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
          {!collapsed && <span className="whitespace-nowrap">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
        </button>
        <button
          onClick={handleSignOut}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm',
            'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground w-full transition-colors',
            collapsed && 'justify-center px-0',
          )}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
