"use client"

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print-btn"
      aria-label="Print or save as PDF"
    >
      Print / Save as PDF
    </button>
  )
}
