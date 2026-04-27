import Link from "next/link"
import "./landing.css"

export const revalidate = 3600 // re-generate at most once per hour

export default function LandingPage() {
  return (
    <>
      {/* Nav */}
      <nav className="nav">
        <Link href="/" className="nav-wordmark">PolicyPen</Link>
        <div className="nav-actions">
          <Link href="/sign-in" className="nav-signin">Sign in</Link>
          <Link href="/sign-up" className="btn-primary">Get Started →</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-eyebrow">Legal policies for indie makers</div>
        <h1>Privacy policies that actually make sense.</h1>
        <p className="hero-sub">
          Answer 12 questions. Get a complete, jurisdiction-aware policy suite — Privacy Policy,
          Terms of Service, Cookie Policy, and Refund Policy — in under 2 minutes.
        </p>
        <div className="hero-ctas">
          <Link href="/sign-up" className="btn-primary">Generate my policies →</Link>
          <Link href="/demo" className="btn-ghost">See a sample policy</Link>
        </div>


      </section>

      {/* Social proof */}
      <div className="social-proof">
        Built for solo founders, indie makers, and small teams who need real policies — not lawyer bills.
      </div>

      {/* How it works */}
      <section className="how-it-works">
        <h2 className="how-it-works-heading">How it works</h2>
        <div className="steps-grid">
          <div className="step">
            <div className="step-number">01</div>
            <div className="step-title">Describe your product</div>
            <p className="step-desc">
              Answer a short questionnaire about your product, business model, and jurisdiction.
            </p>
          </div>
          <div className="step">
            <div className="step-number">02</div>
            <div className="step-title">AI drafts your policies</div>
            <p className="step-desc">
              Claude generates jurisdiction-aware policies with the right clauses for your situation.
            </p>
          </div>
          <div className="step">
            <div className="step-number">03</div>
            <div className="step-title">Publish instantly</div>
            <p className="step-desc">
              Get a hosted policy page, embed widget, or download PDF/Markdown.
            </p>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* Policy showcase */}
      <section className="showcase-section">
        <h2 className="showcase-heading">What your policies look like</h2>
        <p className="showcase-sub">
          Real output for Launchify, a fictional SaaS — generated in under 2 minutes.
        </p>
        <div className="showcase-grid">

          {/* Privacy Policy card */}
          <div className="showcase-card">
            <div className="showcase-card-label">Privacy Policy</div>
            <div className="showcase-card-body">
              <div className="showcase-excerpt-heading">1. Information We Collect</div>
              <p className="showcase-excerpt-text">
                When you create an account or use our Service, we collect your name, email address,
                payment information (processed by Stripe), and content you create within the platform.
                We also automatically collect log data, device information, and usage analytics.
              </p>
              <div className="showcase-excerpt-heading" style={{ marginTop: 14 }}>2. How We Use Your Information</div>
              <p className="showcase-excerpt-text">
                We use the information we collect to provide and improve the Service, process transactions,
                send technical notices, respond to your requests, and comply with legal obligations.
              </p>
            </div>
          </div>

          {/* Terms of Service card */}
          <div className="showcase-card">
            <div className="showcase-card-label">Terms of Service</div>
            <div className="showcase-card-body">
              <div className="showcase-excerpt-heading">1. Acceptance of Terms</div>
              <p className="showcase-excerpt-text">
                By accessing or using Launchify, you agree to be bound by these Terms of Service and our
                Privacy Policy. These Terms constitute a legally binding agreement between you and Launchify Inc.
              </p>
              <div className="showcase-excerpt-heading" style={{ marginTop: 14 }}>4. Subscription &amp; Billing</div>
              <p className="showcase-excerpt-text">
                Paid plans are billed monthly or annually in advance. We offer a 14-day free trial.
                Subscriptions auto-renew unless cancelled at least 24 hours before the renewal date.
              </p>
            </div>
          </div>

          {/* Cookie Policy card */}
          <div className="showcase-card">
            <div className="showcase-card-label">Cookie Policy</div>
            <div className="showcase-card-body">
              <div className="showcase-excerpt-heading">What Are Cookies</div>
              <p className="showcase-excerpt-text">
                Cookies are small text files placed on your device when you visit our website. We use
                strictly necessary cookies for authentication, analytics cookies to understand usage
                patterns, and preference cookies to remember your settings.
              </p>
              <div className="showcase-excerpt-heading" style={{ marginTop: 14 }}>Your Choices</div>
              <p className="showcase-excerpt-text">
                You can control cookies through your browser settings or our cookie preference centre.
                Blocking strictly necessary cookies may prevent certain features from working correctly.
              </p>
            </div>
          </div>

        </div>
        <div className="showcase-cta">
          <Link href="/demo" className="btn-ghost">Read the full sample policy →</Link>
        </div>
      </section>

      <hr className="section-divider" />

      {/* Pricing */}
      <section className="pricing-section">
        <h2 className="pricing-heading">Simple, honest pricing</h2>
        <p className="pricing-sub">No per-document fees. Cancel any time.</p>
        <div className="pricing-grid">
          {/* Starter */}
          <div className="pricing-card">
            <div className="pricing-tier">Starter</div>
            <div className="pricing-price">$9<span>/mo</span></div>
            <p className="pricing-tagline">For your first product</p>
            <ul className="pricing-features">
              <li>1 product</li>
              <li>4 core policies (Privacy, ToS, Cookie, Refund)</li>
              <li>US jurisdiction</li>
              <li>Hosted policy link</li>
            </ul>
            <Link href="/sign-up" className="btn-ghost">Start free</Link>
          </div>

          {/* Builder — featured */}
          <div className="pricing-card featured">
            <div className="popular-tag">Most popular</div>
            <div className="pricing-tier">Builder</div>
            <div className="pricing-price">$29<span>/mo</span></div>
            <p className="pricing-tagline">For growing indie products</p>
            <ul className="pricing-features">
              <li>5 products</li>
              <li>4 core + GDPR DPA, CCPA addendum</li>
              <li>Multi-jurisdiction (US, EU, UK, CA, IN, AU)</li>
              <li>Embed widget + iframe</li>
              <li>Auto-updates when laws change</li>
            </ul>
            <Link href="/sign-up" className="btn-primary">Start building</Link>
          </div>

          {/* Studio */}
          <div className="pricing-card">
            <div className="pricing-tier">Studio</div>
            <div className="pricing-price">$59<span>/mo</span></div>
            <p className="pricing-tagline">For agencies and power users</p>
            <ul className="pricing-features">
              <li>Unlimited products</li>
              <li>All policy types</li>
              <li>All 19 jurisdictions (LGPD, APPI, PIPEDA + more)</li>
              <li>Custom domain</li>
              <li>White-label branding removal</li>
            </ul>
            <Link href="/sign-up" className="btn-ghost">Go studio</Link>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* FAQ */}
      <section className="faq-section">
        <h2 className="faq-heading">Questions &amp; answers</h2>
        <div className="faq-item">
          <div className="faq-q">Is this actually legally valid?</div>
          <p className="faq-a">
            Yes, generated policies are based on real legal frameworks. For complex situations, consult
            a lawyer. Most indie SaaS products are well-covered by what PolicyPen generates.
          </p>
        </div>
        <div className="faq-item">
          <div className="faq-q">What jurisdictions do you cover?</div>
          <p className="faq-a">
            Starter covers US. Builder adds EU/GDPR, UK, Canada, India, and Australia. Studio covers
            all 19 jurisdictions including LGPD, APPI, PIPEDA, and more.
          </p>
        </div>
        <div className="faq-item">
          <div className="faq-q">What happens when laws change?</div>
          <p className="faq-a">
            Builder and Studio plans auto-update your policies when relevant legislation changes.
            You get notified before any update goes live.
          </p>
        </div>
        <div className="faq-item">
          <div className="faq-q">Can I use this for my client projects?</div>
          <p className="faq-a">
            Studio plan includes white-label and agency-grade branding removal. Perfect for
            freelancers and agencies managing multiple client products.
          </p>
        </div>
        <div className="faq-item">
          <div className="faq-q">Do you store my policy content?</div>
          <p className="faq-a">
            Yes, your policies are saved and versioned. You can export PDF, HTML, or Markdown
            at any time from your dashboard.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-brand">
          <Link href="/" className="footer-wordmark">PolicyPen</Link>
          <span>© 2026</span>
        </div>
        <div className="footer-links">
          <Link href="/p/policypen/privacy">Privacy Policy</Link>
          <Link href="/p/policypen/tos">Terms</Link>
          <a href="mailto:hello@policypen.io">Contact</a>
        </div>
      </footer>
    </>
  )
}
