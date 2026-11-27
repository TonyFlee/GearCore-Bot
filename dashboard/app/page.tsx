import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import StatusOverview from "@/components/StatusOverview";
import { isAuthenticated } from "@/lib/auth";
import { controlFetch } from "@/lib/control";
import type { BotStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  if (!await isAuthenticated()) redirect("/login");

  let status: BotStatus | null = null;
  let error = "";
  try {
    status = await controlFetch<BotStatus>("/api/status");
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Bot control API is unavailable.";
  }

  return (
    <DashboardShell title="Bot status" description="Live health and configuration for the GearCore Discord bot.">
      <StatusOverview initialStatus={status} initialError={error} />
    </DashboardShell>
  );
}
