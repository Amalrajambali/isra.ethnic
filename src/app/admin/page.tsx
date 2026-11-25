"use client";

import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";

type Post = {
  id: string;
  description: string;
  imageUrl?: string;
  permalink?: string;
  price: string | null;
};

type RowState = { value: string; status: "idle" | "saving" | "saved" | "error"; message?: string };

const PASSWORD_KEY = "isra-admin-password";

function readSavedPassword() {
  try {
    return sessionStorage.getItem(PASSWORD_KEY) || "";
  } catch {
    return "";
  }
}

function rememberPassword(password: string | null) {
  try {
    if (password) sessionStorage.setItem(PASSWORD_KEY, password);
    else sessionStorage.removeItem(PASSWORD_KEY);
  } catch {
    // Private browsing can block storage; the admin just has to log in again.
  }
}

export default function AdminPricesPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "missing">("all");

  async function load(pass: string) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/prices", { headers: { "x-admin-password": pass } });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not load posts");

      rememberPassword(pass);
      setPosts(body.posts);
      setRows(
        Object.fromEntries(
          (body.posts as Post[]).map((post) => [post.id, { value: post.price || "", status: "idle" }])
        )
      );
    } catch (err) {
      if (err instanceof Error && err.message === "Wrong password") rememberPassword(null);
      setError(err instanceof Error ? err.message : "Could not load posts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = readSavedPassword();
    if (saved) {
      setPassword(saved);
      load(saved);
    }
  }, []);

  async function save(post: Post) {
    const value = rows[post.id]?.value.trim() ?? "";
    setRows((current) => ({ ...current, [post.id]: { value, status: "saving" } }));

    try {
      const response = await fetch("/api/admin/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({ id: post.id, price: value }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not save");

      setPosts((current) => current?.map((p) => (p.id === post.id ? { ...p, price: body.price } : p)) ?? null);
      setRows((current) => ({ ...current, [post.id]: { value: body.price || "", status: "saved" } }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save";
      setRows((current) => ({ ...current, [post.id]: { value, status: "error", message } }));
    }
  }

  if (!posts) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            load(password);
          }}
          className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm"
        >
          <h1 className="font-headline text-2xl text-primary">Price Admin</h1>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Admin password"
              autoFocus
              className="w-full rounded-lg border border-border px-3 py-2 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-primary"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 font-semibold text-primary-foreground disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Log in
          </button>
        </form>
      </main>
    );
  }

  const missingCount = posts.filter((post) => !post.price).length;
  const visiblePosts = filter === "missing" ? posts.filter((post) => !post.price) : posts;

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-headline text-2xl sm:text-3xl text-primary">Instagram Prices</h1>
            <p className="text-sm text-muted-foreground">
              Leave a price empty to show &quot;Ask Price&quot; on the website. Changes appear within a minute.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              rememberPassword(null);
              setPosts(null);
              setPassword("");
            }}
            className="text-sm font-semibold text-muted-foreground hover:text-primary"
          >
            Log out
          </button>
        </div>

        <div className="flex gap-2 text-sm">
          {(["all", "missing"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-full border px-4 py-1.5 font-semibold ${
                filter === option ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white"
              }`}
            >
              {option === "all" ? `All (${posts.length})` : `No price (${missingCount})`}
            </button>
          ))}
        </div>

        <ul className="space-y-3">
          {visiblePosts.map((post) => {
            const row = rows[post.id] || { value: "", status: "idle" };
            const changed = row.value.trim() !== (post.price || "");

            return (
              <li key={post.id} className="flex items-center gap-3 rounded-xl border border-border bg-white p-3">
                <a href={post.permalink} target="_blank" rel="noreferrer" className="shrink-0">
                  <img src={post.imageUrl} alt="" className="h-20 w-16 rounded-lg object-cover bg-muted" />
                </a>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="line-clamp-2 text-sm font-semibold">{post.description}</p>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      save(post);
                    }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-muted-foreground">₹</span>
                    <input
                      inputMode="numeric"
                      value={row.value}
                      onChange={(event) =>
                        setRows((current) => ({
                          ...current,
                          [post.id]: { value: event.target.value, status: "idle" },
                        }))
                      }
                      placeholder="Price"
                      className="w-28 rounded-lg border border-border px-3 py-1.5"
                    />
                    <button
                      type="submit"
                      disabled={!changed || row.status === "saving"}
                      className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
                    >
                      {row.status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                    </button>
                    {row.status === "saved" && !changed && <Check className="h-4 w-4 text-green-600" />}
                  </form>
                  {row.status === "error" && <p className="text-xs text-red-600">{row.message}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
