import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "link-roll",
  description: "Roll a random saved video link."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="max-w-3xl mx-auto p-6">
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Link Roll</h1>
            <nav className="flex items-center gap-4 text-sm">
              <a className="hover:text-amber-600" href="/">Home</a>
              <a className="hover:text-amber-600" href="/links">My Links</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
