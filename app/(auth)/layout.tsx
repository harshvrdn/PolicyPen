export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--paper2)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: 'var(--serif)',
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--accent)',
            letterSpacing: '-0.3px',
          }}>
            PolicyPen
          </span>
        </a>
      </div>

      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'var(--paper)',
        border: '1px solid var(--rule)',
        borderRadius: '8px',
        padding: '36px 32px',
        boxShadow: '0 2px 12px rgba(28,24,16,0.07)',
      }}>
        {children}
      </div>
    </div>
  )
}
