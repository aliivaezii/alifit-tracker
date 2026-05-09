import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { MobileThemeToggle } from '@/components/layout/mobile-theme-toggle'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen">
      {/* Blurred gym background shared across all app pages */}
      <div
        className="fixed inset-0 -z-10 scale-105"
        style={{
          backgroundImage: "url('/hero-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          filter: 'blur(8px)',
        }}
      />
      <div className="fixed inset-0 -z-10 bg-black/60" />
      <Sidebar />
      <main className="flex-1 overflow-auto pb-28 lg:pb-0">
        {/* Mobile header with theme toggle */}
        <div className="lg:hidden flex items-center justify-end px-4 pt-3 pb-1">
          <MobileThemeToggle />
        </div>
        <div className="max-w-5xl mx-auto p-4 lg:p-6">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
