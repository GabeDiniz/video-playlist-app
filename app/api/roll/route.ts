import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const last = await supabase
    .from("rolls")
    .select("link_id")
    .order("created_at", { ascending: false })
    .limit(3);

  const exclude: string[] = (last.data ?? []).map((r: any) => r.link_id);

  const rpc = await supabase.rpc("random_link_excluding", { exclude_ids: exclude.length ? exclude : null });
  let picked = rpc.data && rpc.data[0];

  if (!picked) {
    const all = await supabase
      .from("links")
      .select("id,url,title,thumbnail_url,embed_html");

    const eligible = (all.data ?? []).filter(l => !exclude.includes(l.id));
    if (eligible.length) picked = eligible[Math.floor(Math.random() * eligible.length)];
  }

  if (!picked) return NextResponse.json({ error: "No links yet." }, { status: 404 });

  await supabase.from("rolls").insert({ user_id: user.id, link_id: picked.id });
  return NextResponse.json(picked);
}
