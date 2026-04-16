import { signup } from './actions'

export const metadata = {
  title: 'Create account — PolicyPen',
}

export default function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  return <SignupForm searchParams={searchParams} />
}

async function SignupForm({
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
          We sent a confirmation link to your inbox.
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
          Already confirmed?{' '}
          <a href="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>
            Sign in
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
        Create account
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '28px' }}>
        Start generating legal documents in minutes
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

      <form action={signup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

        <div>
          <label htmlFor="password" style={labelStyle}>Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="At least 8 characters"
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" style={labelStyle}>Confirm password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            style={inputStyle}
          />
        </div>

        <button type="submit" style={buttonStyle}>
          Create account
        </button>
      </form>

      <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--muted)' }}>
        Already have an account?{' '}
        <a href="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>
          Sign in
        </a>
      </p>

      <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>
        By creating an account you agree to our{' '}
        <a href="/legal/terms" style={{ color: 'var(--muted)', textDecoration: 'underline' }}>Terms</a>
        {' '}and{' '}
        <a href="/legal/privacy" style={{ color: 'var(--muted)', textDecoration: 'underline' }}>Privacy Policy</a>.
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
