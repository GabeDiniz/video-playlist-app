"use client";

import { useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import AddLinkForm from "@/components/AddLinkForm";
import LinkCard from "@/components/LinkCard";

type Link = {
  id: string;
  url: string;
  title: string | null;
  thumbnail_url: string | null;
  embed_html: string | null;
};

export default function LinksPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/links");
    if (res.ok) setLinks(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <AuthGate>
      <div className="space-y-4">
        <AddLinkForm onAdded={load} />
        {loading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : links.length === 0 ? (
          <div className="text-sm text-gray-600">No links yet.</div>
        ) : (
          <div className="space-y-3">
            {links.map(l => <LinkCard key={l.id} link={l} onDeleted={load} />)}
          </div>
        )}
      </div>
    </AuthGate>
  );
}
