import Link from "next/link"
import "./landing.css"

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
          <Link href="/p/sample-product" className="btn-ghost">See a sample policy</Link>
        </div>

        {/* Faux document preview */}
        <div className="doc-preview" aria-hidden="true">
          <div className="doc-line heading"></div>
          <div className="doc-line"></div>
          <div className="doc-line"></div>
          <div className="doc-line"></div>
          <div className="doc-line"></div>
          <div className="doc-line heading" style={{ marginTop: "20px" }}></div>
          <div className="doc-line"></div>
          <div className="doc-line"></div>
          <div className="doc-line"></div>
          <div className="doc-line"></div>
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
