import { requestPasswordReset } from './actions'

export const metadata = {
  title: 'Reset password — PolicyPen',
}

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  return <ResetPasswordForm searchParams={searchParams} />
}

async function ResetPasswordForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const params = await searchParams
  const error = params.error
  const message = params.message

  if (message) {
    return (
      <>
        <h1 style={{
          fontFamily: 'var(--serif)',
          fontSize: '22px',
          fontWeight: 700,
          color: 'var(--ink)',
          marginBottom: '6px',
        }}>
          Check your email
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>
          Follow the link in your inbox to set a new password.
        </p>
        <div style={{
          background: 'var(--accent-light)',
          border: '1px solid var(--accent-border)',
          borderRadius: '6px',
          padding: '12px 16px',
          fontSize: '14px',
          color: 'var(--accent)',
          marginBottom: '24px',
        }}>
          {message}
        </div>
        <p style={{ fontSize: '14px', color: 'var(--muted)', textAlign: 'center' }}>
          <a href="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>
            Back to sign in
          </a>
        </p>
      </>
    )
  }

  return (
    <>
      <h1 style={{
        fontFamily: 'var(--serif)',
        fontSize: '22px',
        fontWeight: 700,
        color: 'var(--ink)',
        marginBottom: '6px',
      }}>
        Reset password
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '28px' }}>
        Enter your email and we&apos;ll send you a reset link
      </p>

      {error && (
        <div style={{
          background: 'var(--red-light)',
          border: '1px solid #e8b4b4',
          borderRadius: '6px',
          padding: '10px 14px',
          marginBottom: '20px',
          fontSize: '14px',
          color: 'var(--red)',
        }}>
          {error}
        </div>
      )}

      <form action={requestPasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label htmlFor="email" style={labelStyle}>Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            style={inputStyle}
          />
        </div>

        <button type="submit" style={buttonStyle}>
          Send reset link
        </button>
      </form>

      <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--muted)' }}>
        <a href="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>
          Back to sign in
        </a>
      </p>
    </>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--ink2)',
  marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  fontSize: '14px',
  color: 'var(--ink)',
  background: 'var(--paper)',
  border: '1px solid var(--rule2)',
  borderRadius: '6px',
  outline: 'none',
  fontFamily: 'var(--sans)',
}

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  fontSize: '14px',
  fontWeight: 600,
  color: '#fff',
  background: 'var(--accent)',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontFamily: 'var(--sans)',
  marginTop: '4px',
}
