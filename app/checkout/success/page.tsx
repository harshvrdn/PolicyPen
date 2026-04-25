import Link from "next/link"

export default function CheckoutSuccessPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        fontFamily: "var(--font-sans, sans-serif)",
        background: "var(--background, #0f0f0f)",
        color: "var(--foreground, #fff)",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <div style={{ fontSize: 48 }}>🎉</div>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>You&apos;re all set!</h1>
      <p style={{ color: "var(--muted, #888)", maxWidth: 400, margin: 0 }}>
        Your payment was successful. Your plan will be active shortly — it may take a few seconds to sync.
      </p>
      <Link
        href="/dashboard"
        style={{
          marginTop: 8,
          padding: "10px 24px",
          background: "var(--accent, #7c3aed)",
          color: "#fff",
          borderRadius: 8,
          textDecoration: "none",
          fontWeight: 600,
          fontSize: 15,
        }}
      >
        Go to Dashboard
      </Link>
    </div>
  )
}
