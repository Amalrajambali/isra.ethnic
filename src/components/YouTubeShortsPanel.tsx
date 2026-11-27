"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Youtube } from "lucide-react";

type UploadLogEntry = { reelId: string; videoId: string; title: string; permalink: string; at: string };
type SyncResult = {
  at: string;
  uploaded: UploadLogEntry[];
  failed: { reelId: string; error: string }[];
  skipped: { reelId: string; reason: string }[];
  message?: string;
};
type Status = {
  configured: boolean;
  connected: boolean;
  channel: string;
  since: string | null;
  lastRun: SyncResult | null;
  recent: UploadLogEntry[];
  redirectUri: string;
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

function describeRun(run: SyncResult) {
  const parts = [`${run.uploaded.length} uploaded`];
  if (run.failed.length) parts.push(`${run.failed.length} failed`);
  if (run.skipped.length) parts.push(`${run.skipped.length} skipped`);
  return `${parts.join(", ")}. ${run.message || ""}`;
}

export function YouTubeShortsPanel({ password }: { password: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState<"" | "connect" | "sync" | "disconnect">("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function call(method: "GET" | "POST", action?: string) {
    const response = await fetch("/api/admin/youtube", {
      method,
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      ...(action && { body: JSON.stringify({ action }) }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "YouTube request failed");
    return body;
  }

  async function refresh() {
    try {
      setStatus(await call("GET"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load YouTube status");
    }
  }

  useEffect(() => {
    // The Google callback returns to /admin?youtube=<channel> or ?youtubeError=<message>.
    const params = new URLSearchParams(window.location.search);
    const channel = params.get("youtube");
    const failure = params.get("youtubeError");
    if (channel) setNotice(`Connected to "${channel}". New reels will be posted as Shorts from now on.`);
    if (failure) setError(failure);
    if (channel || failure) window.history.replaceState(null, "", "/admin");
    refresh();
  }, []);

  async function run(action: "connect" | "sync" | "disconnect") {
    if (action === "disconnect" && !confirm("Stop posting reels to YouTube?")) return;
    setBusy(action);
    setError("");
    setNotice("");
    try {
      const body = await call("POST", action);
      if (action === "connect") {
        window.location.href = body.url;
        return;
      }
      if (action === "sync") {
        const result = body as SyncResult;
        setNotice(describeRun(result));
        if (result.failed.length) setError(result.failed.map((item) => item.error).join(" · "));
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "YouTube request failed");
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold">
          <Youtube className="h-5 w-5 text-red-600" />
          Auto-post reels to YouTube Shorts
        </h2>
        {status?.connected && (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!!busy}
              onClick={() => run("sync")}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {busy === "sync" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Sync now
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => run("disconnect")}
              className="rounded-full border border-border px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:text-red-600 disabled:opacity-50"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {!status && !error && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}

      {status && !status.configured && (
        <p className="text-sm text-muted-foreground">
          Add <code>YOUTUBE_CLIENT_ID</code> and <code>YOUTUBE_CLIENT_SECRET</code> to the hosting environment
          variables, then redeploy. In Google Cloud, set the OAuth redirect URI to{" "}
          <code className="break-all">{status.redirectUri}</code>
        </p>
      )}

      {status?.configured && !status.connected && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Sign in with the Google account that owns the ISRA YouTube channel. Only reels posted after you connect
            are uploaded, so old reels won't flood the channel.
          </p>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => run("connect")}
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy === "connect" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Youtube className="h-4 w-4" />}
            Connect YouTube
          </button>
        </div>
      )}

      {status?.connected && (
        <div className="space-y-2 text-sm">
          <p>
            Posting to <strong>{status.channel || "your channel"}</strong>
            {status.since && <> · reels posted after {formatTime(status.since)}</>}
          </p>
          {status.lastRun && (
            <p className="text-muted-foreground">
              Last check {formatTime(status.lastRun.at)}: {describeRun(status.lastRun)}
            </p>
          )}
          {status.recent.length > 0 && (
            <ul className="space-y-1">
              {status.recent.slice(0, 5).map((entry) => (
                <li key={entry.videoId} className="truncate">
                  <a
                    href={`https://youtube.com/shorts/${entry.videoId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-primary hover:underline"
                  >
                    {entry.title}
                  </a>{" "}
                  <span className="text-muted-foreground">· {formatTime(entry.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {notice && <p className="text-sm text-green-700">{notice}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
