'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Dumbbell, Salad, TrendingUp, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/training', label: 'Training', icon: Dumbbell, primaryHref: '/training/plan' },
  { href: '/nutrition', label: 'Nutrition', icon: Salad, primaryHref: '/nutrition/log' },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const TRAINING_SUB_TABS = [
  { href: '/training/plan', label: 'Plan' },
  { href: '/training/log', label: 'Log' },
  { href: '/training/analytics', label: 'Analytics' },
  { href: '/training/deload', label: 'Deload' },
]

const NUTRITION_SUB_TABS = [
  { href: '/nutrition/meals', label: 'Meals' },
  { href: '/nutrition/log', label: 'Log' },
  { href: '/nutrition/analytics', label: 'Analytics' },
  { href: '/nutrition/calculator', label: 'Calculator' },
]

export function BottomNav() {
  const pathname = usePathname()

  const onTraining = pathname.startsWith('/training')
  const onNutrition = pathname.startsWith('/nutrition')
  const subTabs = onTraining ? TRAINING_SUB_TABS : onNutrition ? NUTRITION_SUB_TABS : null

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Sub-navigation strip (only on Training / Nutrition) */}
      {subTabs && (
        <nav className="flex items-center bg-sidebar/95 border-t border-sidebar-border overflow-x-auto scrollbar-hide">
          {subTabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex-shrink-0 px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2',
                pathname === tab.href || pathname.startsWith(tab.href + '/')
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      )}

      {/* Main bottom nav */}
      <nav className="flex items-center bg-sidebar border-t border-sidebar-border">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const linkHref = 'primaryHref' in item ? item.primaryHref! : item.href
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={linkHref}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
