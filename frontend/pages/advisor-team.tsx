import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

import Layout from "../components/Layout";
import { useDemoData } from "../lib/demo-data";

interface AgentCard {
  icon: string;
  name: string;
  role: string;
  description: string;
  color: string;
}

const agents: AgentCard[] = [
  {
    icon: "Planner",
    name: "Financial Planner",
    role: "Orchestrator",
    description: "Coordinates the overall workflow and delegates each specialist task.",
    color: "bg-purple-100 text-ai-accent",
  },
  {
    icon: "Report",
    name: "Portfolio Analyst",
    role: "Reporter",
    description: "Generates the written narrative and recommendations.",
    color: "bg-blue-100 text-primary",
  },
  {
    icon: "Charts",
    name: "Chart Specialist",
    role: "Charter",
    description: "Builds the visual story from the underlying holdings.",
    color: "bg-green-100 text-green-700",
  },
  {
    icon: "Retire",
    name: "Retirement Specialist",
    role: "Retirement",
    description: "Projects future readiness and highlights the remaining gap.",
    color: "bg-yellow-100 text-yellow-700",
  },
];

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdvisorTeam() {
  const router = useRouter();
  const { ready, jobs, startAnalysis } = useDemoData();
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [stage, setStage] = useState<"idle" | "planner" | "parallel" | "complete">("idle");

  const activeJob = useMemo(() => jobs.find((job) => job.id === activeJobId), [jobs, activeJobId]);
  const latestJobs = useMemo(() => [...jobs].sort((a, b) => b.created_at.localeCompare(a.created_at)), [jobs]);

  useEffect(() => {
    if (!activeJobId) {
      return;
    }

    const plannerTimer = window.setTimeout(() => setStage("parallel"), 1600);
    return () => window.clearTimeout(plannerTimer);
  }, [activeJobId]);

  useEffect(() => {
    if (!activeJob) {
      return;
    }

    if (activeJob.status === "completed") {
      setStage("complete");
      const redirectTimer = window.setTimeout(() => {
        router.push(`/analysis?job_id=${activeJob.id}`);
      }, 1200);
      return () => window.clearTimeout(redirectTimer);
    }

    return undefined;
  }, [activeJob, router]);

  if (!ready) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-600">Loading advisor team...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Advisor Team | Alex Demo</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="bg-gradient-to-r from-primary/10 to-ai-accent/10 rounded-2xl p-8">
          <p className="text-sm uppercase tracking-wide text-ai-accent font-semibold mb-3">AI orchestration demo</p>
          <h1 className="text-3xl font-bold text-dark mb-3">Simulated multi-agent workflow</h1>
          <p className="text-gray-600 max-w-3xl">
            This page preserves the production story while running entirely in-browser. Start a fresh analysis to
            create a new job, animate the happy path, and land on a completed report with charts and retirement output.
          </p>
          <button
            onClick={() => {
              const jobId = startAnalysis();
              setActiveJobId(jobId);
              setStage("planner");
            }}
            className="mt-6 rounded-lg bg-ai-accent px-6 py-3 text-white font-semibold hover:bg-purple-700"
          >
            Start New Analysis
          </button>
        </section>

        <section className="grid gap-6 lg:grid-cols-4">
          {agents.map((agent) => {
            const isActive =
              stage === "planner"
                ? agent.role === "Orchestrator"
                : stage === "parallel"
                  ? agent.role !== "Orchestrator"
                  : false;

            return (
              <div key={agent.name} className="bg-white rounded-2xl shadow-sm p-6">
                <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${agent.color}`}>{agent.icon}</div>
                <h2 className="text-xl font-bold text-dark mt-4">{agent.name}</h2>
                <p className="text-sm font-medium text-gray-500 mt-1">{agent.role}</p>
                <p className="text-gray-600 mt-4">{agent.description}</p>
                <div className="mt-5">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {isActive ? "Active now" : "Waiting"}
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-dark mb-4">Current run status</h2>
          {activeJob ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-gray-50 p-5">
                <p className="text-sm text-gray-500 mb-2">Job ID</p>
                <p className="font-semibold text-dark">{activeJob.id}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-sm text-gray-500 mb-2">Stage</p>
                  <p className="font-semibold text-dark capitalize">{stage}</p>
                </div>
                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-sm text-gray-500 mb-2">Backend status</p>
                  <p className="font-semibold text-dark capitalize">{activeJob.status}</p>
                </div>
                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-sm text-gray-500 mb-2">Created at</p>
                  <p className="font-semibold text-dark">{formatDate(activeJob.created_at)}</p>
                </div>
              </div>
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-gray-700">
                {stage === "planner" && "The planner is loading account data and preparing each specialist task."}
                {stage === "parallel" && "Reporter, chart maker, and retirement specialist are running in parallel."}
                {stage === "complete" && "Analysis complete. Redirecting to the finished report."}
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No active run yet. Start an analysis to show the workflow.</p>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-dark mb-4">Job history</h2>
          <div className="space-y-4">
            {latestJobs.map((job) => (
              <button
                key={job.id}
                onClick={() => router.push(`/analysis?job_id=${job.id}`)}
                className="w-full rounded-xl border border-gray-100 p-4 text-left hover:border-primary hover:shadow-sm transition-all"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-dark">{job.job_type} analysis</p>
                    <p className="text-sm text-gray-500 mt-1">{formatDate(job.created_at)}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      job.status === "completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-primary"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
