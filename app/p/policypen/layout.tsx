import Link from "next/link"
import "@/app/policy-public.css"

export default function PolicyPenPolicyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="policy-page">
      <nav className="policy-nav">
        <Link href="/" className="policy-nav-name">PolicyPen</Link>
        <Link href="/sign-up" className="policy-nav-powered" style={{ color: "var(--accent)", fontWeight: 500 }}>
          Get started →
        </Link>
      </nav>
      {children}
    </div>
  )
}
