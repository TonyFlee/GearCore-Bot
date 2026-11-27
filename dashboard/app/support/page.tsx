import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import SupportInbox from "@/components/SupportInbox";
import { isAuthenticated } from "@/lib/auth";
import { controlFetch } from "@/lib/control";
import type { SupportRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  if (!await isAuthenticated()) redirect("/login");

  let requests: SupportRequest[] = [];
  let error = "";
  try {
    const response = await controlFetch<{ requests: SupportRequest[] }>("/api/support");
    requests = response.requests;
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Bot control API is unavailable.";
  }

  return (
    <DashboardShell title="Support inbox" description="Requests submitted through the Discord /support command.">
      <SupportInbox initialRequests={requests} initialError={error} />
    </DashboardShell>
  );
}
