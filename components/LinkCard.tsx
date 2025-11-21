"use client";

import DOMPurify from "dompurify";
import { useTransition } from "react";

type Link = {
  id: string;
  url: string;
  title: string | null;
  thumbnail_url: string | null;
  embed_html: string | null;
};

export default function LinkCard({ link, onDeleted }:{ link: Link, onDeleted?: () => void }) {
  const [pending, start] = useTransition();
  const clean = link.embed_html ? DOMPurify.sanitize(link.embed_html) : null;

  async function del() {
    start(async () => {
      const res = await fetch(`/api/links/${link.id}`, { method: "DELETE" });
      if (res.ok) onDeleted?.();
    });
  }

  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {link.thumbnail_url && (
          <img src={link.thumbnail_url} alt="" className="w-20 h-12 max-w-32 object-cover rounded-lg" />
        )}
        <div className="flex-1">
          <a href={link.url} target="_blank" className="font-medium hover:underline">
            {link.title || link.url}
          </a>
          <div className="text-xs text-gray-500">{link.url}</div>
        </div>
        <button onClick={del} disabled={pending} className="text-sm text-red-600 hover:underline">
          {pending ? "Deleting..." : "Delete"}
        </button>
      </div>
      {clean && (
        <div className="mt-3">
          <div dangerouslySetInnerHTML={{ __html: clean }} />
        </div>
      )}
    </div>
  );
}
