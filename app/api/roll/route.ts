// app/api/roll/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get all of *this user's* links
  const allRes = await supabase
    .from("links")
    .select("id,url,title,thumbnail_url,embed_html")
    .order("created_at", { ascending: false });

  if (allRes.error) {
    return NextResponse.json({ error: allRes.error.message }, { status: 500 });
  }
  const all = allRes.data ?? [];
  if (all.length === 0) {
    return NextResponse.json({ error: "No links yet." }, { status: 404 });
  }

  // Get last 3 rolls
  const last = await supabase
    .from("rolls")
    .select("link_id")
    .order("created_at", { ascending: false })
    .limit(3);

  const exclude: string[] = (last.data ?? []).map((r: any) => r.link_id);

  // Build eligible list; if exclusion removes everything, ignore it
  let eligible = all.filter(l => !exclude.includes(l.id));
  if (eligible.length === 0) eligible = all;

  // Pick one
  const picked = eligible[Math.floor(Math.random() * eligible.length)];

  // Write history (best-effort)
  await supabase.from("rolls").insert({ user_id: user.id, link_id: picked.id });

  return NextResponse.json(picked);
}
