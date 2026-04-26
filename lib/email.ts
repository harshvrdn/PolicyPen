import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@policypen.io"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://policypen.io"

function baseTemplate(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>PolicyPen</title>
<style>
  body { margin: 0; padding: 0; background: #fefcf8; font-family: 'Helvetica Neue', Arial, sans-serif; }
  .wrap { max-width: 560px; margin: 40px auto; background: #fff; border: 1px solid #e4dfd3; border-radius: 8px; overflow: hidden; }
  .header { padding: 28px 36px; border-bottom: 1px solid #e4dfd3; }
  .logo { font-size: 18px; font-weight: 700; color: #1a4a2e; letter-spacing: -0.3px; }
  .body { padding: 32px 36px; }
  h1 { font-size: 20px; color: #1c1810; margin: 0 0 12px; font-weight: 700; }
  p { font-size: 15px; color: #3a3428; line-height: 1.6; margin: 0 0 16px; }
  .btn { display: inline-block; padding: 10px 20px; background: #1a4a2e; color: #fff !important; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500; margin: 8px 0 20px; }
  .footer { padding: 20px 36px; border-top: 1px solid #e4dfd3; font-size: 12px; color: #7a7060; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><div class="logo">PolicyPen</div></div>
  <div class="body">${body}</div>
  <div class="footer">PolicyPen · AI-powered legal document generator · <a href="${APP_URL}" style="color:#1a4a2e;">${APP_URL}</a></div>
</div>
</body>
</html>`
}

export async function sendWelcomeEmail(to: string, firstName: string | null): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const name = firstName ?? "there"
  const html = baseTemplate(`
    <h1>Welcome to PolicyPen, ${name}.</h1>
    <p>You're all set. PolicyPen generates legally-aware privacy policies, terms of service, cookie policies, and refund policies for your products — tailored to the jurisdictions you operate in.</p>
    <p>Get started by adding your first product:</p>
    <a href="${APP_URL}/products/new" class="btn">Add your first product →</a>
    <p>If you have any questions, reply to this email and we'll get back to you.</p>
  `)

  try {
    await resend.emails.send({ from: FROM, to, subject: "Welcome to PolicyPen", html })
  } catch (err) {
    console.error("[email:welcome]", err)
  }
}

export async function sendPaymentConfirmationEmail(
  to: string,
  firstName: string | null,
  plan: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const name = firstName ?? "there"
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)
  const html = baseTemplate(`
    <h1>Your ${planLabel} plan is active, ${name}.</h1>
    <p>Payment confirmed. Your PolicyPen account has been upgraded to the <strong>${planLabel}</strong> plan.</p>
    <p>You now have access to:</p>
    <ul style="margin:0 0 16px;padding-left:20px;color:#3a3428;font-size:15px;line-height:1.8;">
      ${plan === "starter" ? "<li>1 product</li><li>4 policy types</li><li>Basic jurisdictions</li>" : ""}
      ${plan === "builder" ? "<li>5 products</li><li>All policy types</li><li>Multi-jurisdiction coverage</li><li>Law update alerts</li>" : ""}
      ${plan === "studio" ? "<li>Unlimited products</li><li>All policy types</li><li>Priority support</li><li>White-label policies</li>" : ""}
    </ul>
    <a href="${APP_URL}/dashboard" class="btn">Go to dashboard →</a>
    <p>Questions about your plan? Reply to this email.</p>
  `)

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Your PolicyPen ${planLabel} plan is now active`,
      html,
    })
  } catch (err) {
    console.error("[email:payment]", err)
  }
}

export async function sendLawUpdateEmail(
  to: string,
  updates: { title: string; regulation: string; severity: string; summary: string }[]
): Promise<void> {
  if (!process.env.RESEND_API_KEY || updates.length === 0) return

  const rows = updates
    .map(
      (u) => `
      <div style="padding:14px 0;border-bottom:1px solid #e4dfd3;">
        <div style="font-size:13px;font-weight:600;color:#1c1810;margin-bottom:4px;">${u.title}</div>
        <div style="font-size:12px;color:#7a7060;margin-bottom:6px;">${u.regulation} · ${u.severity}</div>
        <div style="font-size:13px;color:#3a3428;">${u.summary}</div>
      </div>`
    )
    .join("")

  const html = baseTemplate(`
    <h1>${updates.length === 1 ? "A law update affects your policies" : `${updates.length} law updates affect your policies`}</h1>
    <p>The following regulatory changes may require you to regenerate affected policies:</p>
    ${rows}
    <br />
    <a href="${APP_URL}/dashboard" class="btn">Review your policies →</a>
  `)

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject:
        updates.length === 1
          ? `Law update: ${updates[0].title}`
          : `${updates.length} law updates affect your PolicyPen policies`,
      html,
    })
  } catch (err) {
    console.error("[email:law-update]", err)
  }
}
