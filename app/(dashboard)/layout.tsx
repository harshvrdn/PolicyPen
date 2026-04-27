import { ToastProvider } from "@/components/Toast"
import { Sidebar } from "@/components/Sidebar"
import "../dashboard.css"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="dashboard-root">
        <Sidebar />
        <main className="dashboard-main">
          {children}
        </main>
      </div>
    </ToastProvider>
  )
}
