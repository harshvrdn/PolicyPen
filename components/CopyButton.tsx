"use client"

import { useState } from "react"

interface CopyButtonProps {
  text: string
  label?: string
}

export default function CopyButton({ text, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback for older browsers
      const el = document.createElement("textarea")
      el.value = text
      el.style.position = "fixed"
      el.style.opacity = "0"
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        background: "var(--paper3)",
        color: "var(--ink2)",
        border: "1px solid var(--rule2)",
        borderRadius: 4,
        padding: "4px 10px",
        fontSize: 12,
        cursor: "pointer",
        fontFamily: "var(--sans)",
        whiteSpace: "nowrap",
        transition: "background 0.1s",
      }}
    >
      {copied ? "Copied!" : label}
    </button>
  )
}
