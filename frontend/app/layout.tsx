import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "AI Sales CRM Platform",
  description: "Production-ready AI-powered Sales CRM platform built with Next.js, Supabase, and FastAPI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-850 py-6 text-center text-xs text-slate-500">
          AI Sales CRM Architecture &bull; Powered by Supabase, Next.js &amp; FastAPI &bull; Phase 1 Foundation
        </footer>
      </body>
    </html>
  );
}
