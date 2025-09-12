import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function fetchOEmbed(url: string) {
  const isYT = /youtu(\.be|be\.com)/.test(url);
  const isV = /vimeo\.com/.test(url);
  const endpoint = isYT
    ? `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    : isV
      ? `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`
      : null;

  if (!endpoint) return { title: null, thumbnail_url: null, html: null };

  const resp = await fetch(endpoint, { headers: { "User-Agent": "link-roll/1.0" } });
  if (!resp.ok) return { title: null, thumbnail_url: null, html: null };
  const data = await resp.json();
  return { title: data.title ?? null, thumbnail_url: data.thumbnail_url ?? null, html: data.html ?? null };
}

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("links")
    .select("id,url,title,thumbnail_url,embed_html")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const meta = await fetchOEmbed(url);
  const { data, error } = await supabase
    .from("links")
    .insert({ user_id: user.id, url, title: meta.title, thumbnail_url: meta.thumbnail_url, embed_html: meta.html })
    .select("id,url,title,thumbnail_url,embed_html")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
