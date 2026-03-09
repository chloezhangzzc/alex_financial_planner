import Link from "next/link";
import { useRouter } from "next/router";
import { type ReactNode } from "react";

import PageTransition from "./PageTransition";
import { useDemoData } from "../lib/demo-data";

interface LayoutProps {
  children: ReactNode;
}

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/accounts", label: "Accounts" },
  { href: "/advisor-team", label: "Advisor Team" },
  { href: "/analysis", label: "Analysis" },
];

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { user } = useDemoData();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center justify-between gap-4">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-ai-accent font-semibold">Client Demo</p>
                  <h1 className="text-xl font-bold text-dark">
                    Alex <span className="text-primary">AI Financial Advisor</span>
                  </h1>
                </div>
              </Link>
              <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-ai-accent">
                No AWS / No Login
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {navLinks.map((link) => {
                const isActive = router.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors ${
                      isActive ? "text-primary" : "text-gray-600 hover:text-primary"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-gray-700">
              Viewing as <span className="font-semibold text-dark">{user.display_name}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>

      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 font-medium mb-2">Demo Disclaimer</p>
            <p className="text-xs text-gray-600">
              This Vercel build is a demo experience powered by seeded mock data. It showcases the product flow
              without live AWS infrastructure, market feeds, or personalized advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
