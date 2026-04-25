import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--background, #0f0f0f)",
      }}
    >
      <SignIn />
    </div>
  )
}
