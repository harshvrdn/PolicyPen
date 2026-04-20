import { auth } from "@clerk/nextjs/server"
import { getCurrentUser } from "@/lib/db/dal"
import SettingsTabs from "./SettingsTabs"

export default async function SettingsPage() {
  const { userId } = await auth()
  const dbUser = userId ? await getCurrentUser(userId).catch(() => null) : null

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and billing preferences.</p>
        </div>
      </div>
      <SettingsTabs dbUser={dbUser} />
    </div>
  )
}
