import Head from "next/head";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Head>
        <title>Alex AI Financial Advisor Demo</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
        <nav className="px-8 py-6 bg-white shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ai-accent font-semibold">Interactive Demo</p>
              <h1 className="text-2xl font-bold text-dark">
                Alex <span className="text-primary">AI Financial Advisor</span>
              </h1>
            </div>
            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Open Demo
              </Link>
              <Link
                href="/analysis"
                className="px-6 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
              >
                View Sample Analysis
              </Link>
            </div>
          </div>
        </nav>

        <section className="px-8 py-20">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-5xl font-bold text-dark mb-6">A client-ready portfolio demo without AWS setup</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              This version of Alex is optimized for local review and Vercel deployment. It keeps the core product
              story, seeded portfolio data, and AI workflow simulation while removing the AWS and login requirements.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-ai-accent text-white text-lg rounded-lg hover:bg-purple-700 transition-colors shadow-lg"
              >
                Explore Dashboard
              </Link>
              <Link
                href="/advisor-team"
                className="px-8 py-4 border-2 border-primary text-primary text-lg rounded-lg hover:bg-primary hover:text-white transition-colors"
              >
                Simulate Analysis Run
              </Link>
            </div>
          </div>
        </section>

        <section className="px-8 py-16 bg-white">
          <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-blue-100 p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary mb-3">Portfolio visibility</p>
              <h3 className="text-2xl font-semibold text-dark mb-3">Dashboard and account drill-down</h3>
              <p className="text-gray-600">
                Review goals, holdings, allocation mix, and account-level detail from a seeded investor profile.
              </p>
            </div>
            <div className="rounded-2xl border border-purple-100 p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-ai-accent mb-3">Agent workflow</p>
              <h3 className="text-2xl font-semibold text-dark mb-3">Simulated multi-agent orchestration</h3>
              <p className="text-gray-600">
                Trigger a realistic analysis run and watch the planner, reporter, chart maker, and retirement
                specialist progress through the happy path.
              </p>
            </div>
            <div className="rounded-2xl border border-yellow-100 p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-accent mb-3">Client storytelling</p>
              <h3 className="text-2xl font-semibold text-dark mb-3">Ready for Vercel demos</h3>
              <p className="text-gray-600">
                No cloud accounts, no secrets, and no backend dependencies. Deploy the static frontend as a polished
                showcase build.
              </p>
            </div>
          </div>
        </section>

        <section className="px-8 py-20">
          <div className="max-w-5xl mx-auto rounded-3xl bg-dark text-white p-10">
            <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-4">Included in this demo</p>
            <div className="grid gap-4 md:grid-cols-2 text-left text-gray-200">
              <p>Seeded user profile and sample portfolio holdings</p>
              <p>Editable accounts, positions, and retirement preferences</p>
              <p>Sample report markdown, charts, and retirement projection</p>
              <p>In-browser analysis lifecycle instead of SQS and Lambda agents</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
