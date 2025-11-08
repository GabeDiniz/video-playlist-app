// app/api/session/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return NextResponse.json({ user: user ? { id: user.id, email: user.email } : null });
}
