import { updatePassword } from '../actions'

export const metadata = {
  title: 'Set new password — PolicyPen',
}

export default function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return <UpdatePasswordForm searchParams={searchParams} />
}

async function UpdatePasswordForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const error = params.error

  return (
    <>
      <h1 style={{
        fontFamily: 'var(--serif)',
        fontSize: '22px',
        fontWeight: 700,
        color: 'var(--ink)',
        marginBottom: '6px',
      }}>
        Set new password
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '28px' }}>
        Choose a strong password for your account
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

      <form action={updatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label htmlFor="password" style={labelStyle}>New password</label>
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
          <label htmlFor="confirmPassword" style={labelStyle}>Confirm new password</label>
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
          Update password
        </button>
      </form>
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
