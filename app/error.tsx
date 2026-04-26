"use client"

import Link from "next/link"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#fefcf8", fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "40px 20px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 14, color: "#7a7060", marginBottom: 12, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Error
          </div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#1c1810", margin: "0 0 12px" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 15, color: "#7a7060", maxWidth: 420, lineHeight: 1.6, margin: "0 0 28px" }}>
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={reset}
              style={{
                padding: "9px 18px",
                background: "#1a4a2e",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <Link
              href="/dashboard"
              style={{
                padding: "9px 18px",
                background: "transparent",
                color: "#3a3428",
                border: "1px solid #d4cfc3",
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Go to dashboard
            </Link>
          </div>
          {error.digest && (
            <p style={{ marginTop: 24, fontSize: 11, color: "#b0a898" }}>
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
