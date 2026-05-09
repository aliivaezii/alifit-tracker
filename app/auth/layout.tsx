export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      {/* Blurred gym background — scale(1.05) prevents blur from showing white edges */}
      <div
        className="fixed inset-0 -z-10 scale-105"
        style={{
          backgroundImage: "url('/hero-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          filter: 'blur(8px)',
        }}
      />
      {/* Dark overlay for contrast */}
      <div className="fixed inset-0 -z-10 bg-black/60" />
      {children}
    </div>
  )
}
