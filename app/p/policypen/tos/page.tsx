import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service — PolicyPen",
  description:
    "PolicyPen's Terms of Service. Read the terms governing your use of our AI-powered legal policy generation platform.",
}

export default function PolicyPenTosPage() {
  const lastUpdated = "April 27, 2026"

  return (
    <div className="policy-doc">

      {/* Tab strip */}
      <div className="policy-tabs">
        <Link href="/p/policypen/privacy" className="policy-tab">Privacy Policy</Link>
        <span className="policy-tab active">Terms of Service</span>
      </div>

      <div className="policy-single-header">
        <h1>Terms of Service</h1>
        <div className="policy-meta">
          <span>Last updated: {lastUpdated}</span>
          <span>Version 1.0</span>
        </div>
      </div>

      <div className="policy-content">

        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of PolicyPen (&ldquo;Service,&rdquo;
          &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) at <a href="https://policypen.io">policypen.io</a>. By
          creating an account or using the Service, you agree to be bound by these Terms. If you do not agree,
          do not use the Service.
        </p>

        <h2>1. Eligibility</h2>
        <p>
          You must be at least 16 years old and capable of forming a binding contract to use the Service.
          By using PolicyPen, you represent that you meet these requirements. If you are using PolicyPen
          on behalf of a business, you represent that you have authority to bind that business to these Terms.
        </p>

        <h2>2. Your Account</h2>
        <p>
          You are responsible for maintaining the security of your account credentials and for all activity
          that occurs under your account. You must notify us immediately at{" "}
          <a href="mailto:hello@policypen.io">hello@policypen.io</a> if you suspect unauthorized access.
          We are not liable for losses caused by unauthorized access resulting from your failure to secure
          your credentials.
        </p>
        <p>
          You may not share your account with others, create accounts by automated means, or create multiple
          accounts to circumvent plan limits.
        </p>

        <h2>3. The Service</h2>
        <p>
          PolicyPen provides an AI-assisted tool that generates legal policy documents (Privacy Policies,
          Terms of Service, Cookie Policies, Refund Policies, and related documents) based on the information
          you provide. The Service includes a hosted public policy page for each product, an embed widget,
          and document export features.
        </p>
        <p>
          <strong>Important:</strong> PolicyPen generates policy documents using AI. These documents are
          provided for informational purposes and as a starting point. They do not constitute legal advice.
          For complex legal situations, regulated industries, or high-stakes deployments, consult a qualified
          attorney in your jurisdiction. We make no warranty that generated policies are legally sufficient
          for your specific circumstances.
        </p>

        <h2>4. Subscription Plans and Billing</h2>

        <h3>Plans</h3>
        <p>
          PolicyPen offers free trial access and three paid plans: Starter ($9/mo), Builder ($29/mo), and
          Studio ($59/mo). Feature availability varies by plan as described at{" "}
          <Link href="/#pricing">policypen.io/#pricing</Link>.
        </p>

        <h3>Billing</h3>
        <p>
          Paid subscriptions are billed monthly in advance via Dodo Payments. You authorize us to charge
          your payment method on a recurring basis until you cancel. All prices are in USD and exclusive
          of applicable taxes (VAT, GST, etc.), which may be added depending on your location.
        </p>

        <h3>Auto-renewal</h3>
        <p>
          Subscriptions renew automatically at the end of each billing period. You may cancel at any time
          from your account settings. Cancellation takes effect at the end of the current paid period — you
          retain access until then and will not be charged again.
        </p>

        <h3>Free trial</h3>
        <p>
          New accounts may be eligible for a free trial period. At the end of the trial, you will be charged
          for the selected plan unless you cancel before the trial ends. We will remind you before trial expiry.
        </p>

        <h3>Refunds</h3>
        <p>
          We offer a <strong>7-day money-back guarantee</strong> for first-time paid subscriptions. If you are
          not satisfied within 7 days of your first charge, contact{" "}
          <a href="mailto:hello@policypen.io">hello@policypen.io</a> for a full refund. After 7 days, charges
          are non-refundable except where required by applicable law (e.g., EU consumers have a 14-day
          withdrawal right — see Section 10).
        </p>

        <h2>5. Acceptable Use</h2>
        <p>You agree not to use the Service to:</p>
        <ul>
          <li>Generate policies intended to deceive consumers or misrepresent your data practices</li>
          <li>Create fictitious policies for non-existent products with intent to defraud</li>
          <li>Circumvent rate limits or access limits through automated means</li>
          <li>Resell or redistribute generated content without proper attribution (except as permitted on the Studio plan)</li>
          <li>Violate any applicable laws, including privacy laws in your jurisdiction</li>
          <li>Attempt to reverse-engineer, scrape, or extract our AI prompts or proprietary systems</li>
          <li>Interfere with or disrupt the Service or its infrastructure</li>
        </ul>
        <p>
          We reserve the right to suspend or terminate accounts that violate these rules at our sole discretion,
          with or without notice.
        </p>

        <h2>6. Ownership and Licenses</h2>

        <h3>Your content</h3>
        <p>
          You own the policy documents generated for your products. By using the Service, you grant us a
          limited license to store, host, and serve your policy content solely to provide the Service
          (e.g., your hosted public policy page).
        </p>

        <h3>Our content and platform</h3>
        <p>
          The PolicyPen platform, software, prompts, clause libraries, and branding are owned by us or our
          licensors. Nothing in these Terms transfers ownership of our intellectual property to you. You may
          not copy, reverse-engineer, or create derivative works from our platform.
        </p>

        <h3>Feedback</h3>
        <p>
          If you submit feedback, suggestions, or ideas about the Service, you grant us a perpetual,
          royalty-free license to use them without obligation or compensation to you.
        </p>

        <h2>7. Privacy</h2>
        <p>
          Our collection and use of your personal data is governed by our{" "}
          <Link href="/p/policypen/privacy">Privacy Policy</Link>, which is incorporated into these Terms
          by reference.
        </p>

        <h2>8. Disclaimers</h2>
        <p>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER
          EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT: (A) THE SERVICE WILL BE
          UNINTERRUPTED OR ERROR-FREE; (B) ANY GENERATED DOCUMENT IS LEGALLY COMPLETE, ACCURATE, OR
          APPROPRIATE FOR YOUR SPECIFIC SITUATION; (C) THE SERVICE WILL MEET YOUR REQUIREMENTS.
        </p>

        <h2>9. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL POLICYPEN BE LIABLE FOR
          ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS,
          DATA, OR GOODWILL, ARISING FROM OR RELATING TO YOUR USE OF THE SERVICE, EVEN IF WE HAVE BEEN
          ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
        </p>
        <p>
          OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATING TO THESE TERMS OR THE SERVICE
          SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM
          OR (B) $50 USD.
        </p>

        <h2>10. EU / UK Consumer Rights</h2>
        <p>
          If you are a consumer in the European Economic Area or United Kingdom, you have the right to
          withdraw from a purchase within 14 days of the transaction date, provided you have not yet
          used the digital service (i.e., you have not generated any policies). Once you start using the
          Service, you expressly consent to immediate delivery of the digital content and acknowledge
          that you lose your right of withdrawal. To exercise your right of withdrawal before first use,
          contact <a href="mailto:hello@policypen.io">hello@policypen.io</a> within 14 days of purchase.
        </p>

        <h2>11. Termination</h2>
        <p>
          You may cancel your account at any time from account settings or by emailing us. We may suspend
          or terminate your account for breach of these Terms, non-payment, or if required by law, with
          reasonable notice where practicable.
        </p>
        <p>
          Upon termination, your right to access the Service ends. Sections 6 (Ownership), 8 (Disclaimers),
          9 (Limitation of Liability), and 13 (Governing Law) survive termination.
        </p>

        <h2>12. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. We will provide at least 14 days&rsquo; notice of material
          changes by email or in-app notification. Your continued use of the Service after the effective date
          constitutes acceptance of the updated Terms. If you do not agree to the changes, you may cancel
          your account before they take effect.
        </p>

        <h2>13. Governing Law and Disputes</h2>
        <p>
          These Terms are governed by the laws of the United States, without regard to conflict-of-law
          principles. For EU/UK consumers, mandatory consumer protection laws in your country of residence
          also apply and are not affected by this clause.
        </p>
        <p>
          We prefer to resolve disputes amicably. If you have a concern, please contact us at{" "}
          <a href="mailto:hello@policypen.io">hello@policypen.io</a> before initiating any formal proceedings.
          For users in the EU, the European Commission provides an online dispute resolution platform at{" "}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
            ec.europa.eu/consumers/odr
          </a>.
        </p>

        <h2>14. Miscellaneous</h2>
        <p>
          These Terms, together with the Privacy Policy, constitute the entire agreement between you and
          PolicyPen regarding the Service. If any provision is found unenforceable, the remaining provisions
          continue in full force. Our failure to enforce any right or provision does not constitute a waiver.
          You may not assign your rights under these Terms without our written consent. We may assign our
          rights to a successor in connection with a merger, acquisition, or sale of assets.
        </p>

        <h2>15. Contact</h2>
        <p>
          Questions about these Terms? Email us at{" "}
          <a href="mailto:hello@policypen.io">hello@policypen.io</a>.
        </p>

      </div>

      <div className="policy-attribution">
        <Link href="/">PolicyPen</Link> &mdash; AI-powered legal policies for indie makers.
      </div>

    </div>
  )
}
