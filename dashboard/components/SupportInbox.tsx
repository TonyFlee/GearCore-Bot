"use client";

import { useState } from "react";
import type { SupportRequest } from "@/lib/types";

type Props = { initialRequests: SupportRequest[]; initialError: string };

export default function SupportInbox({ initialRequests, initialError }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [error, setError] = useState(initialError);
  const [filter, setFilter] = useState<"all" | "open" | "read">("all");

  async function act(request: SupportRequest, action: "read" | "delete") {
    setError("");
    const response = await fetch(`/api/support/${encodeURIComponent(request.id)}`, {
      method: action === "read" ? "PATCH" : "DELETE",
    });
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(body.error || "Action failed.");
      return;
    }

    setRequests((current) =>
      action === "delete"
        ? current.filter((item) => item.id !== request.id)
        : current.map((item) => item.id === request.id ? { ...item, status: "read" } : item)
    );
  }

  const visible = requests.filter((request) => filter === "all" || request.status === filter);

  return (
    <>
      {error ? <div className="card error">{error}</div> : null}
      <div className="card">
        <div className="actions" style={{ marginTop: 0 }}>
          {(["all", "open", "read"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={filter === value ? "" : "secondary"}
              onClick={() => setFilter(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? <div className="card muted">No support requests in this view.</div> : null}

      <div className="list">
        {visible.map((request) => (
          <div className="request" key={request.id}>
            <div className="request-head">
              <strong>{request.userTag}</strong>
              <span className={`badge ${request.status}`}>{request.status}</span>
            </div>
            <div className="muted">{request.guild} · {new Date(request.createdAt).toLocaleString()}</div>
            <p>{request.message}</p>
            <div className="actions">
              {request.status === "open" ? (
                <button className="small" type="button" onClick={() => void act(request, "read")}>Mark read</button>
              ) : null}
              <button className="danger small" type="button" onClick={() => void act(request, "delete")}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
