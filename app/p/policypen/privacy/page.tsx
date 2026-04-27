import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy — PolicyPen",
  description:
    "PolicyPen's Privacy Policy. Learn how we collect, use, and protect your data when you use our AI-powered legal policy generator.",
}

export default function PolicyPenPrivacyPage() {
  const lastUpdated = "April 27, 2026"

  return (
    <div className="policy-doc">

      {/* Tab strip */}
      <div className="policy-tabs">
        <span className="policy-tab active">Privacy Policy</span>
        <Link href="/p/policypen/tos" className="policy-tab">Terms of Service</Link>
      </div>

      <div className="policy-single-header">
        <h1>Privacy Policy</h1>
        <div className="policy-meta">
          <span>Last updated: {lastUpdated}</span>
          <span>Version 1.0</span>
        </div>
      </div>

      <div className="policy-content">

        <p>
          This Privacy Policy describes how PolicyPen (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects,
          uses, and shares information about you when you visit <a href="https://policypen.io">policypen.io</a> and use our
          AI-powered policy generation service (the &ldquo;Service&rdquo;). By using the Service you agree to the practices
          described in this policy.
        </p>

        <h2>1. Who We Are</h2>
        <p>
          PolicyPen is an independent SaaS product. For questions about this policy, contact us at{" "}
          <a href="mailto:hello@policypen.io">hello@policypen.io</a>.
        </p>

        <h2>2. Information We Collect</h2>

        <h3>Account information</h3>
        <p>
          We use <strong>Clerk</strong> for authentication. When you sign up, Clerk collects your email address,
          name, and (if you use OAuth) your Google or GitHub profile. We receive and store your Clerk user ID,
          email address, and display name in our database to identify your account.
        </p>

        <h3>Policy and product data</h3>
        <p>
          We store the information you provide when creating products and generating policies — including product
          names, website URLs, business descriptions, jurisdiction selections, and the questionnaire answers you
          submit. Generated policy content (HTML text) is stored in our database linked to your account.
        </p>

        <h3>Payment information</h3>
        <p>
          We use <strong>Dodo Payments</strong> to process subscriptions. Your payment card details are collected
          and stored by Dodo Payments — we never see or store your full card number. We receive billing events
          (subscription created, renewed, cancelled) and store your Dodo customer and subscription IDs for
          plan management.
        </p>

        <h3>Usage data</h3>
        <p>
          We track token usage per month (to enforce free plan limits) and count policy generations and products
          created. We do not sell this data or use it for advertising.
        </p>

        <h3>Log and technical data</h3>
        <p>
          Our infrastructure (Vercel) automatically collects standard web server logs including IP addresses,
          browser type, pages visited, and timestamps. This data is used for security, debugging, and performance
          monitoring and is retained according to Vercel&rsquo;s data retention policies.
        </p>

        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>Provide and operate the Service (generate policies, host policy pages, manage your account)</li>
          <li>Process payments and manage your subscription</li>
          <li>Send transactional emails (sign-up confirmation, payment receipts, law update notifications)</li>
          <li>Enforce free plan usage limits</li>
          <li>Diagnose bugs and improve performance</li>
          <li>Comply with legal obligations</li>
        </ul>
        <p>
          We do <strong>not</strong> use your policy content to train AI models. Prompts and content are
          sent to Anthropic&rsquo;s Claude API solely to generate your requested documents; Anthropic&rsquo;s data
          usage policies apply to that processing.
        </p>

        <h2>4. Third-Party Services</h2>
        <p>We share data with the following sub-processors to operate the Service:</p>
        <ul>
          <li><strong>Clerk</strong> (clerk.com) — authentication and session management</li>
          <li><strong>Supabase</strong> (supabase.com) — database and file storage</li>
          <li><strong>Anthropic</strong> (anthropic.com) — AI policy generation via the Claude API</li>
          <li><strong>Dodo Payments</strong> (dodopayments.com) — subscription billing</li>
          <li><strong>Vercel</strong> (vercel.com) — hosting, edge network, serverless functions</li>
          <li><strong>Resend</strong> (resend.com) — transactional email delivery</li>
        </ul>
        <p>
          Each of these providers has their own privacy policy governing their use of data. We encourage you to
          review them. We do not share your personal data with any advertising networks or data brokers.
        </p>

        <h2>5. Data Retention</h2>
        <p>
          We retain your account data for as long as your account is active. If you delete your account, we will
          remove your personal data and policy content within 30 days, except where retention is required by law
          (for example, billing records may be retained for up to 7 years for tax purposes).
        </p>
        <p>
          You may request deletion of your data at any time by emailing{" "}
          <a href="mailto:hello@policypen.io">hello@policypen.io</a>.
        </p>

        <h2>6. Cookies</h2>
        <p>
          We use cookies solely for authentication (Clerk session cookies) and to remember your preferences.
          We do not use advertising or third-party tracking cookies. Your browser can be configured to reject
          cookies, though this will prevent you from staying signed in.
        </p>

        <h2>7. Your Rights</h2>
        <p>
          Regardless of where you are located, you may contact us at any time to:
        </p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Correct inaccurate information</li>
          <li>Request deletion of your account and data</li>
          <li>Export your policy content (available via the dashboard export feature)</li>
          <li>Opt out of marketing emails (unsubscribe link in every email)</li>
        </ul>

        <h3>EU and UK users (GDPR / UK GDPR)</h3>
        <p>
          Our lawful basis for processing is performance of a contract (operating the Service for you) and
          legitimate interests (security, abuse prevention). For marketing emails, we rely on your consent.
          You have the right to lodge a complaint with your local supervisory authority (e.g., the ICO in
          the UK).
        </p>

        <h3>California residents (CCPA / CPRA)</h3>
        <p>
          We do not sell or share your personal information with third parties for advertising purposes.
          You have the right to know, access, correct, and delete your personal information. To exercise
          these rights, email <a href="mailto:hello@policypen.io">hello@policypen.io</a>.
        </p>

        <h2>8. Security</h2>
        <p>
          We use industry-standard measures to protect your data: TLS encryption in transit, encrypted
          database storage via Supabase, Row Level Security (RLS) policies ensuring each user can only
          access their own data, and Clerk&rsquo;s battle-tested authentication infrastructure. No method of
          internet transmission is 100% secure, and we cannot guarantee absolute security.
        </p>

        <h2>9. Children</h2>
        <p>
          The Service is not directed to children under 16. We do not knowingly collect personal information
          from anyone under 16. If you believe a minor has created an account, contact us and we will
          delete it promptly.
        </p>

        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. When we make material changes, we will notify
          registered users by email at least 14 days before the change takes effect. The &ldquo;Last updated&rdquo;
          date at the top of this page will always reflect the most recent revision.
        </p>

        <h2>11. Contact</h2>
        <p>
          Questions or concerns about this policy? Email us at{" "}
          <a href="mailto:hello@policypen.io">hello@policypen.io</a>. We respond within 5 business days.
        </p>

      </div>

      <div className="policy-attribution">
        <Link href="/">PolicyPen</Link> &mdash; AI-powered legal policies for indie makers.
      </div>

    </div>
  )
}
