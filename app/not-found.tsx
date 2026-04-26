import Link from "next/link"

export default function NotFound() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "40px 20px",
      textAlign: "center",
      background: "#fefcf8",
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
    }}>
      <div style={{ fontSize: 14, color: "#7a7060", marginBottom: 12, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        404
      </div>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#1c1810", margin: "0 0 12px" }}>
        Page not found
      </h1>
      <p style={{ fontSize: 15, color: "#7a7060", maxWidth: 380, lineHeight: 1.6, margin: "0 0 28px" }}>
        The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        style={{
          padding: "9px 18px",
          background: "#1a4a2e",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          fontSize: 14,
          fontWeight: 500,
          textDecoration: "none",
        }}
      >
        Go to dashboard
      </Link>
    </div>
  )
}
