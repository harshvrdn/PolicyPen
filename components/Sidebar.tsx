"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"

export function Sidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar whenever the route changes
  useEffect(() => { setOpen(false) }, [pathname])

  // Prevent body scroll while sidebar is open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  return (
    <>
      {/* Mobile-only top bar */}
      <div className="mobile-header">
        <button
          className="hamburger-btn"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>{open ? "✕" : "☰"}</span>
        </button>
        <div className="mobile-logo">
          <Link href="/dashboard">PolicyPen</Link>
        </div>
      </div>

      {/* Backdrop — tap to close */}
      {open && (
        <div
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar${open ? " sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <div className="sidebar-logo">
            <Link href="/dashboard">PolicyPen</Link>
          </div>
        </div>
        <nav className="sidebar-nav">
          <Link
            href="/dashboard"
            className={`nav-link${pathname === "/dashboard" ? " active" : ""}`}
          >
            Dashboard
          </Link>
          <Link
            href="/products"
            className={`nav-link${pathname.startsWith("/products") ? " active" : ""}`}
          >
            Products
          </Link>
          <Link
            href="/settings"
            className={`nav-link${pathname.startsWith("/settings") ? " active" : ""}`}
          >
            Settings
          </Link>
        </nav>
        <div className="sidebar-footer">
          <UserButton />
        </div>
      </aside>
    </>
  )
}
