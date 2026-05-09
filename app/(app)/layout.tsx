import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'

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
      <main className="flex-1 overflow-auto pb-16 lg:pb-0">
        <div className="max-w-5xl mx-auto p-4 lg:p-6">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
