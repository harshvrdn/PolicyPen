import { UserButton } from "@clerk/nextjs"
import Link from "next/link"
import "../dashboard.css"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-root">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-logo">
            <Link href="/dashboard">PolicyPen</Link>
          </div>
        </div>
        <nav className="sidebar-nav">
          <Link href="/dashboard" className="nav-link">Dashboard</Link>
          <Link href="/products" className="nav-link">Products</Link>
          <Link href="/settings" className="nav-link">Settings</Link>
        </nav>
        <div className="sidebar-footer">
          <UserButton />
        </div>
      </aside>
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  )
}
