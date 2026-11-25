"use client";

import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, IndianRupee, Loader2, Sparkles, X } from "lucide-react";

type Filter = "all" | "missing" | "hidden";

type Post = {
  id: string;
  caption: string;
  name: string;
  imageUrl?: string;
  permalink?: string;
  price: string | null;
  hidden: boolean;
};

type RowState = {
  name: string;
  price: string;
  status: "idle" | "saving" | "saved" | "error";
  message?: string;
};

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

function rowFromPost(post: Post): RowState {
  return { name: post.name, price: post.price || "", status: "idle" };
}

export default function AdminPricesPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  async function load(pass: string) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/prices", { headers: { "x-admin-password": pass } });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not load posts");

      rememberPassword(pass);
      setPosts(body.posts);
      setRows(Object.fromEntries((body.posts as Post[]).map((post) => [post.id, rowFromPost(post)])));
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

  function updateRow(id: string, changes: Partial<RowState>) {
    setRows((current) => ({ ...current, [id]: { ...current[id], status: "idle", ...changes } }));
  }

  // Sends only the fields given, e.g. { price: "" } from Clear leaves the name alone.
  async function save(post: Post, fields: { name?: string; price?: string; hidden?: boolean }) {
    const { hidden: _hidden, ...rowFields } = fields;
    updateRow(post.id, { ...rowFields, status: "saving" });

    try {
      const response = await fetch("/api/admin/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({ id: post.id, ...fields }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not save");

      const saved: Partial<Post> = {};
      if ("price" in body) saved.price = body.price;
      if ("name" in body) saved.name = body.name || "";
      if ("hidden" in body) saved.hidden = body.hidden;

      const updated = { ...post, ...saved };
      setPosts((current) => current?.map((p) => (p.id === post.id ? updated : p)) ?? null);
      setRows((current) => ({ ...current, [post.id]: { ...rowFromPost(updated), status: "saved" } }));
    } catch (err) {
      updateRow(post.id, { status: "error", message: err instanceof Error ? err.message : "Could not save" });
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
            {loading ? "Loading posts (naming new ones)..." : "Log in"}
          </button>
        </form>
      </main>
    );
  }

  const shownPosts = posts.filter((post) => !post.hidden);
  const hiddenPosts = posts.filter((post) => post.hidden);
  const missingPosts = shownPosts.filter((post) => !post.price);
  const filters: Record<Filter, { label: string; posts: Post[] }> = {
    all: { label: `All (${posts.length})`, posts },
    missing: { label: `No price (${missingPosts.length})`, posts: missingPosts },
    hidden: { label: `Hidden (${hiddenPosts.length})`, posts: hiddenPosts },
  };
  const visiblePosts = filters[filter].posts;

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-headline text-2xl sm:text-3xl text-primary">Instagram Prices</h1>
            <p className="text-sm text-muted-foreground">
              Names are suggested by AI. Edit them if needed, or clear a name and reload for a new suggestion.
              Changes appear on the website within a minute.
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
          {(Object.keys(filters) as Filter[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-full border px-4 py-1.5 font-semibold ${
                filter === option ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white"
              }`}
            >
              {filters[option].label}
            </button>
          ))}
        </div>

        <ul className="space-y-3">
          {visiblePosts.map((post) => {
            const row = rows[post.id] || rowFromPost(post);
            const nameChanged = row.name.trim() !== post.name;
            const priceChanged = row.price.trim() !== (post.price || "");
            const saving = row.status === "saving";

            return (
              <li
                key={post.id}
                className={`flex gap-3 rounded-xl border border-border p-3 ${post.hidden ? "bg-muted/60 opacity-70" : "bg-white"}`}
              >
                <a href={post.permalink} target="_blank" rel="noreferrer" className="shrink-0">
                  <img src={post.imageUrl} alt="" className="h-28 w-20 rounded-lg object-cover bg-muted" />
                </a>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    save(post, {
                      ...(nameChanged && { name: row.name.trim() }),
                      ...(priceChanged && { price: row.price.trim() }),
                    });
                  }}
                  className="min-w-0 flex-1 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 text-xs text-muted-foreground" title={post.caption}>
                      {post.hidden && <span className="mr-1 font-bold text-red-600">HIDDEN ·</span>}
                      Caption: {post.caption}
                    </p>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => save(post, { hidden: !post.hidden })}
                      title={post.hidden ? "Show this post on the website" : "Hide this post from the website (e.g. greetings)"}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-40"
                    >
                      {post.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      {post.hidden ? "Show on website" : "Hide from website"}
                    </button>
                  </div>

                  <label className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-label="Name" />
                    <input
                      value={row.name}
                      onChange={(event) => updateRow(post.id, { name: event.target.value })}
                      placeholder="Name (AI suggestion pending)"
                      maxLength={40}
                      className="w-full min-w-0 rounded-lg border border-border px-3 py-1.5 text-sm font-semibold"
                    />
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <IndianRupee className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        inputMode="numeric"
                        value={row.price}
                        onChange={(event) => updateRow(post.id, { price: event.target.value })}
                        placeholder="Price"
                        className="w-32 rounded-lg border border-border py-1.5 pl-8 pr-3"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={(!nameChanged && !priceChanged) || saving}
                      className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                    </button>
                    {(post.price || row.price) && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => (post.price ? save(post, { price: "" }) : updateRow(post.id, { price: "" }))}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:border-red-300 hover:text-red-600 disabled:opacity-40"
                      >
                        <X className="h-3.5 w-3.5" />
                        Clear price
                      </button>
                    )}
                    {row.status === "saved" && !nameChanged && !priceChanged && (
                      <Check className="h-4 w-4 text-green-600" aria-label="Saved" />
                    )}
                  </div>
                  {row.status === "error" && <p className="text-xs text-red-600">{row.message}</p>}
                </form>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
