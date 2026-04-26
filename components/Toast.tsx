"use client"

import { createContext, useCallback, useContext, useState } from "react"

type ToastType = "success" | "error" | "info"

interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          zIndex: 9999,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              padding: "11px 16px",
              borderRadius: 6,
              fontSize: 14,
              fontFamily: "'Instrument Sans', 'Helvetica Neue', sans-serif",
              fontWeight: 500,
              lineHeight: 1.4,
              maxWidth: 360,
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              pointerEvents: "auto",
              animation: "toastIn 0.2s ease",
              background:
                t.type === "success"
                  ? "#e8f3ec"
                  : t.type === "error"
                  ? "#faeaea"
                  : "#fff",
              color:
                t.type === "success"
                  ? "#1a4a2e"
                  : t.type === "error"
                  ? "#7a1a1a"
                  : "#1c1810",
              border:
                t.type === "success"
                  ? "1px solid #b8d8c4"
                  : t.type === "error"
                  ? "1px solid rgba(122,26,26,0.2)"
                  : "1px solid #e4dfd3",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
      <style>{`@keyframes toastIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
