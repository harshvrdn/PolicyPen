import "@/app/policy-public.css"
import { getPublicProduct } from "@/lib/db/dal"

export default async function PublicPolicyLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getPublicProduct(slug)
  const productName = data?.product.name ?? "Policy"

  return (
    <div className="policy-page">
      <nav className="policy-nav">
        <span className="policy-nav-name">{productName}</span>
        <a
          href="https://policypen.io"
          target="_blank"
          rel="noopener noreferrer"
          className="policy-nav-powered"
        >
          Powered by PolicyPen
        </a>
      </nav>
      {children}
    </div>
  )
}
