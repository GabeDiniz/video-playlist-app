"use client";

import { useEffect, useState, useTransition } from "react";
import AuthGate from "@/components/AuthGate";
import DOMPurify from "dompurify";

type Rolled = {
  id: string;
  url: string;
  title: string | null;
  thumbnail_url: string | null;
  embed_html: string | null;
};

export default function HomePage() {
  const [rolled, setRolled] = useState<Rolled | null>(null);
  const [pending, start] = useTransition();

  async function roll() {
    start(async () => {
      const res = await fetch("/api/roll", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setRolled(data);
      }
    });
  }

  useEffect(() => { roll(); }, []);

  const clean = rolled?.embed_html ? DOMPurify.sanitize(rolled.embed_html) : null;

  return (
    <AuthGate>
      <div className="space-y-4">
        <button
          onClick={roll}
          disabled={pending}
          className="rounded-xl bg-black text-white px-5 py-3 disabled:opacity-50"
        >
          {pending ? "Rolling..." : "🎲 Roll"}
        </button>

        {rolled && (
          <div className="rounded-2xl border p-4">
            <a href={rolled.url} target="_blank" className="font-semibold hover:underline">
              {rolled.title || rolled.url}
            </a>
            {clean && <div className="mt-3" dangerouslySetInnerHTML={{ __html: clean }} />}
          </div>
        )}
      </div>
    </AuthGate>
  );
}
