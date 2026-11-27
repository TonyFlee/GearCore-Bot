import { redirect } from "next/navigation";
import AnnouncementForm from "@/components/AnnouncementForm";
import DashboardShell from "@/components/DashboardShell";
import { isAuthenticated } from "@/lib/auth";
import { controlFetch } from "@/lib/control";
import type { BotSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  if (!await isAuthenticated()) redirect("/login");

  let channelId = "";
  let error = "";
  try {
    const response = await controlFetch<{ settings: BotSettings }>("/api/settings");
    channelId = response.settings.announceChannelId;
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Bot control API is unavailable.";
  }

  return (
    <DashboardShell title="Announcements" description="Post store updates to a Discord channel through the bot.">
      {error ? <div className="card error">{error}</div> : null}
      <AnnouncementForm defaultChannelId={channelId} />
    </DashboardShell>
  );
}
