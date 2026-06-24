"use client"

import { useState } from "react"
import { Monitor, Settings2 } from "lucide-react"
import { PortalHeader } from "@/components/portal-header"
import { AIApplicationsTab } from "@/components/ai-applications-tab"
import { PlatformOperationsTab } from "@/components/platform-operations-tab"

type TabId = "applications" | "operations"

export function GovernancePortal() {
  const [activeTab, setActiveTab] = useState<TabId>("applications")

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader />

      {/* Tab Navigation */}
      <div className="border-b border-border bg-card/50">
        <div className="mx-auto flex max-w-7xl px-4 sm:px-6">
          <TabButton
            active={activeTab === "applications"}
            onClick={() => setActiveTab("applications")}
            icon={<Monitor className="h-4 w-4" />}
            label="AI Applications"
          />
          <TabButton
            active={activeTab === "operations"}
            onClick={() => setActiveTab("operations")}
            icon={<Settings2 className="h-4 w-4" />}
            label="Platform Operations"
          />
        </div>
      </div>

      {/* Tab Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {activeTab === "applications" && <AIApplicationsTab />}
        {activeTab === "operations" && <PlatformOperationsTab />}
      </main>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:border-primary/30 hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
