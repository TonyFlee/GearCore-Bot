import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";

export type SupportRequest = {
  id: string;
  userTag: string;
  userId: string;
  guild: string;
  message: string;
  createdAt: string;
  status: "open" | "read";
};

const storagePath = resolve(process.cwd(), "data", "support.json");
const MAX_REQUESTS = 200;

function persist(requests: SupportRequest[]): void {
  mkdirSync(dirname(storagePath), { recursive: true });
  writeFileSync(storagePath, JSON.stringify(requests, null, 2), "utf8");
}

export function listSupportRequests(): SupportRequest[] {
  try {
    const parsed = JSON.parse(readFileSync(storagePath, "utf8")) as SupportRequest[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_REQUESTS) : [];
  } catch {
    return [];
  }
}

export function addSupportRequest(input: Omit<SupportRequest, "id" | "createdAt" | "status">): SupportRequest {
  const request: SupportRequest = {
    id: randomUUID(),
    userTag: input.userTag,
    userId: input.userId,
    guild: input.guild,
    message: input.message,
    createdAt: new Date().toISOString(),
    status: "open",
  };
  persist([request, ...listSupportRequests()].slice(0, MAX_REQUESTS));
  return request;
}

export function markSupportRead(id: string): boolean {
  const requests = listSupportRequests();
  const index = requests.findIndex((request) => request.id === id);
  if (index < 0) return false;
  requests[index].status = "read";
  persist(requests);
  return true;
}

export function deleteSupportRequest(id: string): boolean {
  const requests = listSupportRequests();
  const remaining = requests.filter((request) => request.id !== id);
  if (remaining.length === requests.length) return false;
  persist(remaining);
  return true;
}
