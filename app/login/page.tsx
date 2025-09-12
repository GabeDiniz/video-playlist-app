"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin } });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-3">Sign in</h2>
      <p className="text-sm text-gray-600 mb-4">We’ll send you a magic link.</p>
      <form onSubmit={signIn} className="flex gap-2">
        <input
          type="email"
          placeholder="you@example.com"
          className="flex-1 border rounded-lg px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="px-4 py-2 rounded-lg bg-black text-white">Send</button>
      </form>
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      {sent && <p className="text-sm text-green-700 mt-3">Check your email.</p>}
    </div>
  );
}
