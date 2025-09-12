"use client";

import { useState } from "react";
import { isAllowedDomain, isValidUrl } from "@/utils/validate";
import { createClient } from "@/lib/supabase/client";

export default function AddLinkForm({ onAdded }: { onAdded?: () => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidUrl(url)) {
      setError("Invalid URL.");
      return;
    }
    if (!isAllowedDomain(url)) {
      setError("Only YouTube or Vimeo for now.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      if (!res.ok) throw new Error(await res.text());
      setUrl("");
      onAdded?.();
    } catch (err: any) {
      setError(err.message ?? "Failed to add link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        className="flex-1 border rounded-lg px-3 py-2"
        placeholder="Paste YouTube/Vimeo URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add"}
      </button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </form>
  );
}
