import Head from "next/head";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

import Layout from "../components/Layout";
import { useDemoData } from "../lib/demo-data";

type TabType = "overview" | "charts" | "retirement";

const COLORS = ["#209DD7", "#753991", "#FFB707", "#34D399", "#F87171", "#062147"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    value
  );
}

export default function Analysis() {
  const router = useRouter();
  const { job_id } = router.query;
  const { ready, getJobById, getLatestCompletedJob } = useDemoData();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const job = useMemo(() => {
    if (typeof job_id === "string") {
      return getJobById(job_id);
    }
    return getLatestCompletedJob();
  }, [job_id, getJobById, getLatestCompletedJob]);

  if (!ready) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-600">Loading analysis...</div>
        </div>
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <h1 className="text-2xl font-bold text-dark mb-3">No analysis available</h1>
            <p className="text-gray-600 mb-6">Run a demo analysis from the Advisor Team page to generate fresh results.</p>
            <button
              onClick={() => router.push("/advisor-team")}
              className="rounded-lg bg-primary px-6 py-3 text-white font-semibold hover:bg-blue-600"
            >
              Start Analysis Demo
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (job.status !== "completed") {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <h1 className="text-2xl font-bold text-dark mb-3">Analysis in progress</h1>
            <p className="text-gray-600 mb-6">This demo job has not completed yet. Check back in a moment.</p>
            <button
              onClick={() => router.push("/advisor-team")}
              className="rounded-lg bg-primary px-6 py-3 text-white font-semibold hover:bg-blue-600"
            >
              Return to Advisor Team
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Analysis | Alex Demo</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-ai-accent font-semibold mb-2">Completed analysis</p>
            <h1 className="text-3xl font-bold text-dark">Portfolio results</h1>
            <p className="text-gray-600 mt-2">
              Generated on {new Date(job.created_at).toLocaleString("en-US")} by the in-browser demo workflow.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/advisor-team")}
              className="rounded-lg border border-primary px-5 py-3 text-primary font-semibold hover:bg-primary hover:text-white"
            >
              Run Another Demo
            </button>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-3">
          <div className="flex flex-wrap gap-2">
            {(["overview", "charts", "retirement"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  activeTab === tab ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {activeTab === "overview" && (
          <section className="bg-white rounded-2xl shadow-sm p-8">
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                {job.report_payload?.content || "No written report available."}
              </ReactMarkdown>
            </div>
          </section>
        )}

        {activeTab === "charts" && job.charts_payload && (
          <section className="grid gap-8 lg:grid-cols-2">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-dark mb-4">Asset allocation</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={job.charts_payload.assetAllocation}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={110}
                      label
                    >
                      {job.charts_payload.assetAllocation.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-dark mb-4">Regional split</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={job.charts_payload.regionAllocation}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={110}
                      label
                    >
                      {job.charts_payload.regionAllocation.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[(index + 2) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-dark mb-4">Account totals</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={job.charts_payload.accountTotals}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="#209DD7" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-dark mb-4">Retirement projection</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={job.charts_payload.retirementProjection}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="value" stroke="#753991" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        {activeTab === "retirement" && job.retirement_payload && (
          <section className="grid gap-6 lg:grid-cols-3">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <p className="text-sm text-gray-500 mb-2">Projected portfolio value</p>
              <p className="text-3xl font-bold text-dark">{formatCurrency(job.retirement_payload.projected_value)}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <p className="text-sm text-gray-500 mb-2">Target gap</p>
              <p className="text-3xl font-bold text-dark">{formatCurrency(job.retirement_payload.target_gap)}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <p className="text-sm text-gray-500 mb-2">Generated by</p>
              <p className="text-3xl font-bold text-dark">{job.retirement_payload.agent}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-8 lg:col-span-3">
              <h2 className="text-2xl font-bold text-dark mb-4">Retirement analysis</h2>
              <p className="text-gray-700 text-lg leading-8">{job.retirement_payload.analysis}</p>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
