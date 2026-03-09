import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from "recharts";

import Layout from "../components/Layout";
import { useDemoData } from "../lib/demo-data";

const COLORS = ["#209DD7", "#753991", "#FFB707", "#062147", "#34D399", "#F87171"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    value
  );
}

export default function Dashboard() {
  const { ready, user, accounts, positions, jobs, getInstrumentBySymbol, updateUser } = useDemoData();
  const [displayName, setDisplayName] = useState(user.display_name);
  const [yearsUntilRetirement, setYearsUntilRetirement] = useState(user.years_until_retirement);
  const [targetRetirementIncome, setTargetRetirementIncome] = useState(user.target_retirement_income);
  const [equityTarget, setEquityTarget] = useState(user.asset_class_targets.equity || 0);
  const [fixedIncomeTarget, setFixedIncomeTarget] = useState(user.asset_class_targets.fixed_income || 0);
  const [alternativesTarget, setAlternativesTarget] = useState(user.asset_class_targets.alternatives || 0);
  const [northAmericaTarget, setNorthAmericaTarget] = useState(user.region_targets.north_america || 0);
  const [internationalTarget, setInternationalTarget] = useState(user.region_targets.international || 0);
  const [saved, setSaved] = useState(false);

  const portfolio = useMemo(() => {
    const assetTotals: Record<string, number> = { Cash: 0 };
    const accountTotals: Array<{ name: string; value: number }> = [];
    let totalValue = 0;

    for (const account of accounts) {
      let accountTotal = Number(account.cash_balance);
      assetTotals.Cash += Number(account.cash_balance);

      const accountPositions = positions.filter((position) => position.account_id === account.id);
      for (const position of accountPositions) {
        const instrument = getInstrumentBySymbol(position.symbol);
        if (!instrument) {
          continue;
        }

        const positionValue = position.quantity * instrument.current_price;
        accountTotal += positionValue;

        for (const [assetClass, percent] of Object.entries(instrument.asset_class_allocation)) {
          const label = assetClass
            .split("_")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");
          assetTotals[label] = (assetTotals[label] || 0) + positionValue * (percent / 100);
        }
      }

      totalValue += accountTotal;
      accountTotals.push({ name: account.account_name, value: Math.round(accountTotal) });
    }

    return {
      totalValue,
      accountTotals,
      assetAllocation: Object.entries(assetTotals)
        .filter(([, value]) => value > 0)
        .map(([name, value]) => ({ name, value: Math.round(value) })),
    };
  }, [accounts, positions, getInstrumentBySymbol]);

  const latestCompletedJob = useMemo(() => jobs.find((job) => job.status === "completed"), [jobs]);

  const handleSave = () => {
    updateUser({
      display_name: displayName,
      years_until_retirement: yearsUntilRetirement,
      target_retirement_income: targetRetirementIncome,
      asset_class_targets: {
        equity: equityTarget,
        fixed_income: fixedIncomeTarget,
        alternatives: alternativesTarget,
      },
      region_targets: {
        north_america: northAmericaTarget,
        international: internationalTarget,
      },
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  if (!ready) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-600">Loading demo data...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Dashboard | Alex Demo</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="grid gap-6 md:grid-cols-4">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-2">Total Portfolio Value</p>
            <p className="text-3xl font-bold text-dark">{formatCurrency(portfolio.totalValue)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-2">Accounts</p>
            <p className="text-3xl font-bold text-dark">{accounts.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-2">Holdings</p>
            <p className="text-3xl font-bold text-dark">{positions.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-2">Latest Analysis</p>
            <p className="text-lg font-semibold text-dark">
              {latestCompletedJob ? new Date(latestCompletedJob.created_at).toLocaleDateString("en-US") : "Not run yet"}
            </p>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm uppercase tracking-wide text-primary font-semibold">Investor profile</p>
                <h2 className="text-2xl font-bold text-dark">Client settings</h2>
              </div>
              {saved && <span className="text-sm font-medium text-green-600">Saved</span>}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-sm font-medium text-gray-700">
                Display name
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Years until retirement
                <input
                  type="number"
                  value={yearsUntilRetirement}
                  onChange={(event) => setYearsUntilRetirement(Number(event.target.value))}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Target retirement income
                <input
                  type="number"
                  value={targetRetirementIncome}
                  onChange={(event) => setTargetRetirementIncome(Number(event.target.value))}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </label>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold text-dark mb-4">Asset class targets</h3>
                <div className="space-y-4">
                  <label className="text-sm font-medium text-gray-700 block">
                    Equity %
                    <input
                      type="number"
                      value={equityTarget}
                      onChange={(event) => setEquityTarget(Number(event.target.value))}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700 block">
                    Fixed income %
                    <input
                      type="number"
                      value={fixedIncomeTarget}
                      onChange={(event) => setFixedIncomeTarget(Number(event.target.value))}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700 block">
                    Alternatives %
                    <input
                      type="number"
                      value={alternativesTarget}
                      onChange={(event) => setAlternativesTarget(Number(event.target.value))}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2"
                    />
                  </label>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-dark mb-4">Regional targets</h3>
                <div className="space-y-4">
                  <label className="text-sm font-medium text-gray-700 block">
                    North America %
                    <input
                      type="number"
                      value={northAmericaTarget}
                      onChange={(event) => setNorthAmericaTarget(Number(event.target.value))}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700 block">
                    International %
                    <input
                      type="number"
                      value={internationalTarget}
                      onChange={(event) => setInternationalTarget(Number(event.target.value))}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2"
                    />
                  </label>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="mt-8 inline-flex items-center rounded-lg bg-primary px-6 py-3 text-white font-semibold hover:bg-blue-600"
            >
              Save Demo Preferences
            </button>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-dark mb-4">Portfolio mix</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={portfolio.assetAllocation} dataKey="value" nameKey="name" outerRadius={100} label>
                      {portfolio.assetAllocation.map((entry, index) => (
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-dark">Account totals</h2>
                <Link href="/accounts" className="text-sm font-semibold text-primary hover:underline">
                  Manage accounts
                </Link>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={portfolio.accountTotals}>
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="#209DD7" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-primary/10 to-ai-accent/10 rounded-2xl p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-ai-accent font-semibold">Next step</p>
            <h2 className="text-2xl font-bold text-dark">Run the AI advisor workflow</h2>
            <p className="text-gray-600">Kick off a simulated analysis to generate a fresh report, charts, and retirement view.</p>
          </div>
          <Link
            href="/advisor-team"
            className="inline-flex items-center rounded-lg bg-ai-accent px-6 py-3 text-white font-semibold hover:bg-purple-700"
          >
            Start Analysis Demo
          </Link>
        </section>
      </div>
    </Layout>
  );
}
