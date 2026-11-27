import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import SettingsForm from "@/components/SettingsForm";
import { isAuthenticated } from "@/lib/auth";
import { controlFetch } from "@/lib/control";
import type { BotSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!await isAuthenticated()) redirect("/login");

  let settings: BotSettings | null = null;
  let error = "";
  try {
    const response = await controlFetch<{ settings: BotSettings }>("/api/settings");
    settings = response.settings;
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Bot control API is unavailable.";
  }

  return (
    <DashboardShell title="Settings" description="Channels, roles, contact details, and feature switches.">
      {error ? <div className="card error">{error}</div> : null}
      {settings ? <SettingsForm initialSettings={settings} /> : null}
    </DashboardShell>
  );
}
