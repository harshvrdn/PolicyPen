import { login } from './actions'

export const metadata = {
  title: 'Sign in — PolicyPen',
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  return <LoginForm searchParams={searchParams} />
}

async function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const params = await searchParams
  const error = params.error
  const message = params.message

  return (
    <>
      <h1 style={{
        fontFamily: 'var(--serif)',
        fontSize: '22px',
        fontWeight: 700,
        color: 'var(--ink)',
        marginBottom: '6px',
      }}>
        Sign in
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '28px' }}>
        Welcome back to PolicyPen
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

      {message && (
        <div style={{
          background: 'var(--accent-light)',
          border: '1px solid var(--accent-border)',
          borderRadius: '6px',
          padding: '10px 14px',
          marginBottom: '20px',
          fontSize: '14px',
          color: 'var(--accent)',
        }}>
          {message}
        </div>
      )}

      <form action={login} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
            <label htmlFor="password" style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
            <a href="/reset-password" style={{ fontSize: '13px', color: 'var(--accent)' }}>
              Forgot password?
            </a>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            style={inputStyle}
          />
        </div>

        <button type="submit" style={buttonStyle}>
          Sign in
        </button>
      </form>

      <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--muted)' }}>
        Don&apos;t have an account?{' '}
        <a href="/signup" style={{ color: 'var(--accent)', fontWeight: 500 }}>
          Sign up
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
