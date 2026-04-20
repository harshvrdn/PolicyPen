import Link from "next/link"
import { getUserProducts } from "@/lib/db/dal"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default async function ProductsPage() {
  const products = await getUserProducts().catch(() => [])

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your products and their legal policies.</p>
        </div>
        <Link href="/products/new" className="btn btn-primary">
          + New Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No products yet</div>
          <p className="empty-state-text">
            Create a product to start generating privacy policies, terms of service, and more.
          </p>
          <Link href="/products/new" className="btn btn-primary">
            Create your first product
          </Link>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`} className="product-card">
              <div className="product-card-name">{product.name}</div>
              {product.website_url && (
                <div className="product-card-url">{product.website_url}</div>
              )}
              {product.description && (
                <p className="text-muted" style={{ marginBottom: 8, lineHeight: 1.4 }}>
                  {product.description}
                </p>
              )}
              <div className="product-card-footer">
                <span className="badge badge-draft">{product.primary_jurisdiction}</span>
                <span className="product-card-date">{formatDate(product.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
