import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// tiny HTML helpers
function extract(content: string, regex: RegExp): string | null {
  const m = content.match(regex); return m?.[1]?.trim() || null;
}
function toAbsolute(base: string, maybe: string | null) {
  if (!maybe) return null;
  try { return new URL(maybe, base).toString(); } catch { return null; }
}

async function headContentType(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { method: "HEAD" });
    if (!r.ok) return null;
    return r.headers.get("content-type");
  } catch { return null; }
}

// oEmbed discovery in page <head>
async function discoverOEmbed(pageUrl: string) {
  try {
    const res = await fetch(pageUrl, { headers: { "User-Agent": "link-roll/1.0" } });
    if (!res.ok) return null;
    const html = await res.text();

    const oembedHref =
      extract(html, /<link[^>]+type=["']application\/json\+oembed["'][^>]+href=["']([^"']+)["']/i) ||
      extract(html, /<link[^>]+href=["']([^"']+)["'][^>]+type=["']application\/json\+oembed["']/i);

    if (!oembedHref) return null;

    const oembedUrl = toAbsolute(pageUrl, oembedHref)!;
    const oeRes = await fetch(oembedUrl, { headers: { "User-Agent": "link-roll/1.0" } });
    if (!oeRes.ok) return null;
    const data = await oeRes.json();

    return {
      title: data.title ?? null,
      thumbnail_url: data.thumbnail_url ?? null,
      // many providers give `html` to iframe/embed
      embed_html: data.html ?? null,
    };
  } catch {
    return null;
  }
}

async function fetchOpenGraph(pageUrl: string) {
  try {
    const res = await fetch(pageUrl, { headers: { "User-Agent": "link-roll/1.0" } });
    if (!res.ok) return null;
    const html = await res.text();

    const ogTitle =
      extract(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
      extract(html, /<title[^>]*>([^<]+)</i);
    const ogImage = extract(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    const ogVideo = extract(html, /<meta[^>]+property=["']og:video(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i);
    const ogVideoType = extract(html, /<meta[^>]+property=["']og:video:type["'][^>]+content=["']([^"']+)["']/i);

    const absImage = toAbsolute(pageUrl, ogImage);
    const absVideo = toAbsolute(pageUrl, ogVideo);

    let embed_html: string | null = null;
    if (absVideo) {
      if (ogVideoType && ogVideoType.startsWith("video/")) {
        embed_html = `<video controls preload="metadata" style="max-width:100%;height:auto" src="${absVideo}"></video>`;
      } else {
        // treat as an embeddable player page
        embed_html = `<iframe src="${absVideo}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="width:100%;aspect-ratio:16/9;"></iframe>`;
      }
    }

    return { title: ogTitle || null, thumbnail_url: absImage || null, embed_html };
  } catch {
    return null;
  }
}

// MAIN metadata fetcher
async function buildPreview(url: string) {
  const u = new URL(url);
  const pathname = u.pathname.toLowerCase();

  // 1) Direct file extensions -> <video>
  if (/\.(mp4|webm|ogg)$/i.test(pathname)) {
    return {
      title: u.hostname,
      thumbnail_url: null,
      embed_html: `<video controls preload="metadata" style="max-width:100%;height:auto" src="${url}"></video>`,
    };
  }

  // 2) HEAD says it's a video -> <video>
  const ct = await headContentType(url);
  if (ct?.startsWith("video/")) {
    return {
      title: u.hostname,
      thumbnail_url: null,
      embed_html: `<video controls preload="metadata" style="max-width:100%;height:auto" src="${url}"></video>`,
    };
  }

  // 3) Try oEmbed discovery on the page
  const oembed = await discoverOEmbed(url);
  if (oembed?.embed_html || oembed?.thumbnail_url || oembed?.title) return oembed;

  // 4) Try Open Graph tags
  const og = await fetchOpenGraph(url);
  if (og?.embed_html || og?.thumbnail_url || og?.title) return og;

  // 5) Fallback: plain link with title only
  return { title: u.toString(), thumbnail_url: null, embed_html: null };
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

  const meta = await buildPreview(url);

  const { data, error } = await supabase
    .from("links")
    .insert({
      user_id: user.id,
      url,
      title: meta.title,
      thumbnail_url: meta.thumbnail_url,
      embed_html: meta.embed_html,
    })
    .select("id,url,title,thumbnail_url,embed_html")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
