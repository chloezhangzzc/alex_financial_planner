import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { emitAnalysisCompleted, emitAnalysisStarted } from "./events";

const STORAGE_KEY = "alex-demo-store-v1";

export interface DemoUser {
  clerk_user_id: string;
  display_name: string;
  years_until_retirement: number;
  target_retirement_income: number;
  asset_class_targets: Record<string, number>;
  region_targets: Record<string, number>;
}

export interface DemoInstrument {
  symbol: string;
  name: string;
  instrument_type: string;
  current_price: number;
  asset_class_allocation: Record<string, number>;
  region_allocation: Record<string, number>;
  sector_allocation?: Record<string, number>;
}

export interface DemoAccount {
  id: string;
  account_name: string;
  account_purpose: string;
  cash_balance: number;
}

export interface DemoPosition {
  id: string;
  account_id: string;
  symbol: string;
  quantity: number;
}

export interface DemoReportPayload {
  agent: string;
  content: string;
  generated_at: string;
}

export interface DemoRetirementPayload {
  agent: string;
  analysis: string;
  generated_at: string;
  projected_value: number;
  target_gap: number;
}

export interface DemoChartsPayload {
  assetAllocation: Array<{ name: string; value: number }>;
  regionAllocation: Array<{ name: string; value: number }>;
  accountTotals: Array<{ name: string; value: number }>;
  retirementProjection: Array<{ year: string; value: number }>;
}

export interface DemoJob {
  id: string;
  created_at: string;
  status: "pending" | "running" | "completed" | "failed";
  job_type: string;
  report_payload?: DemoReportPayload;
  charts_payload?: DemoChartsPayload;
  retirement_payload?: DemoRetirementPayload;
  error_message?: string;
}

interface DemoStore {
  user: DemoUser;
  instruments: DemoInstrument[];
  accounts: DemoAccount[];
  positions: DemoPosition[];
  jobs: DemoJob[];
}

interface DemoContextValue {
  ready: boolean;
  user: DemoUser;
  instruments: DemoInstrument[];
  accounts: DemoAccount[];
  positions: DemoPosition[];
  jobs: DemoJob[];
  updateUser: (patch: Partial<DemoUser>) => void;
  getAccountById: (accountId: string) => DemoAccount | undefined;
  getPositionsForAccount: (accountId: string) => DemoPosition[];
  getInstrumentBySymbol: (symbol: string) => DemoInstrument | undefined;
  getJobById: (jobId: string) => DemoJob | undefined;
  getLatestCompletedJob: () => DemoJob | undefined;
  createAccount: (input: {
    account_name: string;
    account_purpose: string;
    cash_balance: number;
  }) => DemoAccount;
  updateAccount: (
    accountId: string,
    patch: Partial<Pick<DemoAccount, "account_name" | "account_purpose" | "cash_balance">>
  ) => void;
  deleteAccount: (accountId: string) => void;
  addPosition: (input: { account_id: string; symbol: string; quantity: number }) => void;
  updatePosition: (positionId: string, quantity: number) => void;
  deletePosition: (positionId: string) => void;
  populateTestData: () => void;
  resetAccounts: () => void;
  startAnalysis: () => string;
}

const demoInstruments: DemoInstrument[] = [
  {
    symbol: "VOO",
    name: "Vanguard S&P 500 ETF",
    instrument_type: "ETF",
    current_price: 518.42,
    asset_class_allocation: { equity: 100 },
    region_allocation: { north_america: 100 },
    sector_allocation: { technology: 31, healthcare: 13, financials: 12 },
  },
  {
    symbol: "VXUS",
    name: "Vanguard Total International Stock ETF",
    instrument_type: "ETF",
    current_price: 63.55,
    asset_class_allocation: { equity: 100 },
    region_allocation: { international: 100 },
    sector_allocation: { financials: 20, industrials: 14, technology: 12 },
  },
  {
    symbol: "BND",
    name: "Vanguard Total Bond Market ETF",
    instrument_type: "ETF",
    current_price: 72.14,
    asset_class_allocation: { fixed_income: 100 },
    region_allocation: { north_america: 100 },
  },
  {
    symbol: "VNQ",
    name: "Vanguard Real Estate ETF",
    instrument_type: "ETF",
    current_price: 84.31,
    asset_class_allocation: { alternatives: 100 },
    region_allocation: { north_america: 100 },
  },
  {
    symbol: "SCHD",
    name: "Schwab US Dividend Equity ETF",
    instrument_type: "ETF",
    current_price: 81.67,
    asset_class_allocation: { equity: 100 },
    region_allocation: { north_america: 100 },
  },
];

const demoUser: DemoUser = {
  clerk_user_id: "demo-user",
  display_name: "Jordan Lee",
  years_until_retirement: 18,
  target_retirement_income: 95000,
  asset_class_targets: { equity: 65, fixed_income: 25, alternatives: 10 },
  region_targets: { north_america: 60, international: 40 },
};

const demoAccounts: DemoAccount[] = [
  {
    id: "acct-401k",
    account_name: "401(k)",
    account_purpose: "Retirement core holdings",
    cash_balance: 12500,
  },
  {
    id: "acct-brokerage",
    account_name: "Taxable Brokerage",
    account_purpose: "Long-term growth and flexibility",
    cash_balance: 8400,
  },
  {
    id: "acct-roth",
    account_name: "Roth IRA",
    account_purpose: "Tax-free retirement growth",
    cash_balance: 3200,
  },
];

const demoPositions: DemoPosition[] = [
  { id: "pos-1", account_id: "acct-401k", symbol: "VOO", quantity: 120 },
  { id: "pos-2", account_id: "acct-401k", symbol: "BND", quantity: 210 },
  { id: "pos-3", account_id: "acct-brokerage", symbol: "SCHD", quantity: 95 },
  { id: "pos-4", account_id: "acct-brokerage", symbol: "VNQ", quantity: 60 },
  { id: "pos-5", account_id: "acct-roth", symbol: "VXUS", quantity: 140 },
  { id: "pos-6", account_id: "acct-roth", symbol: "VOO", quantity: 35 },
];

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatLabel(name: string) {
  return name
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function buildInstrumentMap(instruments: DemoInstrument[]) {
  return Object.fromEntries(instruments.map((instrument) => [instrument.symbol, instrument]));
}

function computePortfolio(store: DemoStore) {
  const instrumentMap = buildInstrumentMap(store.instruments);
  const assetTotals: Record<string, number> = { cash: 0 };
  const regionTotals: Record<string, number> = {};
  const accountTotals: Array<{ name: string; value: number }> = [];

  let totalPortfolioValue = 0;

  for (const account of store.accounts) {
    const accountPositions = store.positions.filter((position) => position.account_id === account.id);
    let accountTotal = Number(account.cash_balance);
    assetTotals.cash += Number(account.cash_balance);

    for (const position of accountPositions) {
      const instrument = instrumentMap[position.symbol];
      if (!instrument) {
        continue;
      }

      const positionValue = position.quantity * instrument.current_price;
      accountTotal += positionValue;

      for (const [assetClass, percent] of Object.entries(instrument.asset_class_allocation)) {
        assetTotals[assetClass] = (assetTotals[assetClass] || 0) + positionValue * (percent / 100);
      }

      for (const [region, percent] of Object.entries(instrument.region_allocation)) {
        regionTotals[region] = (regionTotals[region] || 0) + positionValue * (percent / 100);
      }
    }

    totalPortfolioValue += accountTotal;
    accountTotals.push({ name: account.account_name, value: roundCurrency(accountTotal) });
  }

  totalPortfolioValue = roundCurrency(totalPortfolioValue);

  return {
    totalPortfolioValue,
    assetAllocation: Object.entries(assetTotals)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name: formatLabel(name), value: roundCurrency(value) })),
    regionAllocation: Object.entries(regionTotals)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name: formatLabel(name), value: roundCurrency(value) })),
    accountTotals,
  };
}

function computeRetirementProjection(store: DemoStore, currentValue: number) {
  const contributionPerYear = 12000;
  const growthRate = 0.07;
  const projection: Array<{ year: string; value: number }> = [];
  let runningValue = currentValue;

  for (let year = 0; year <= store.user.years_until_retirement; year += 3) {
    if (year === 0) {
      projection.push({ year: "Today", value: roundCurrency(runningValue) });
      continue;
    }

    for (let step = 0; step < 3; step += 1) {
      runningValue = runningValue * (1 + growthRate) + contributionPerYear;
    }

    projection.push({
      year: `Year ${Math.min(year, store.user.years_until_retirement)}`,
      value: roundCurrency(runningValue),
    });
  }

  const projectedValue = projection[projection.length - 1]?.value || currentValue;
  const targetNestEgg = store.user.target_retirement_income * 25;

  return {
    projection,
    projectedValue,
    targetGap: roundCurrency(targetNestEgg - projectedValue),
  };
}

function buildAnalysisArtifacts(store: DemoStore) {
  const portfolio = computePortfolio(store);
  const retirement = computeRetirementProjection(store, portfolio.totalPortfolioValue);
  const generatedAt = new Date().toISOString();
  const topAccount = [...portfolio.accountTotals].sort((a, b) => b.value - a.value)[0];
  const leadingAsset = [...portfolio.assetAllocation].sort((a, b) => b.value - a.value)[0];
  const regionalDiversifier = [...portfolio.regionAllocation].sort((a, b) => b.value - a.value)[1];
  const targetGapText =
    retirement.targetGap > 0
      ? `You are currently about $${retirement.targetGap.toLocaleString()} short of the target nest egg.`
      : `You are currently ahead of the target by $${Math.abs(retirement.targetGap).toLocaleString()}.`;

  const report = `# Portfolio Snapshot

- Total portfolio value: **$${portfolio.totalPortfolioValue.toLocaleString()}**
- Largest account: **${topAccount?.name || "N/A"}**
- Primary exposure: **${leadingAsset?.name || "N/A"}**

## Key strengths

1. The portfolio has a strong core in diversified ETFs rather than single-stock concentration.
2. Cash reserves provide flexibility for rebalancing and near-term needs.
3. International exposure adds diversification beyond US large caps.

## Recommended next steps

1. Rebalance gradually toward the ${store.user.asset_class_targets.fixed_income || 25}% fixed income target as retirement gets closer.
2. Consider increasing automated annual contributions to improve retirement readiness.
3. Use the taxable account for flexible cash needs and keep retirement accounts focused on long-term compounding.

## Planner note

${targetGapText} ${regionalDiversifier ? `International diversification is currently anchored by ${regionalDiversifier.name}.` : ""}`;

  return {
    report_payload: {
      agent: "Report Writer",
      content: report,
      generated_at: generatedAt,
    },
    charts_payload: {
      assetAllocation: portfolio.assetAllocation,
      regionAllocation: portfolio.regionAllocation,
      accountTotals: portfolio.accountTotals,
      retirementProjection: retirement.projection,
    },
    retirement_payload: {
      agent: "Retirement Specialist",
      analysis: `At a 7% blended return assumption and $12,000 of annual contributions, the portfolio projects to roughly $${retirement.projectedValue.toLocaleString()} by retirement. ${targetGapText}`,
      generated_at: generatedAt,
      projected_value: retirement.projectedValue,
      target_gap: retirement.targetGap,
    },
  };
}

function createSeedStore(): DemoStore {
  const baseStore: DemoStore = {
    user: demoUser,
    instruments: demoInstruments,
    accounts: demoAccounts,
    positions: demoPositions,
    jobs: [],
  };

  const seededJob: DemoJob = {
    id: "job-seeded-analysis",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    status: "completed",
    job_type: "portfolio",
    ...buildAnalysisArtifacts(baseStore),
  };

  return {
    ...baseStore,
    jobs: [seededJob],
  };
}

function loadStoredState() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as DemoStore;
  } catch {
    return null;
  }
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const seedRef = useRef<DemoStore>(createSeedStore());
  const [store, setStore] = useState<DemoStore>(seedRef.current);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = loadStoredState();
    if (saved) {
      setStore(saved);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [ready, store]);

  const updateJob = useCallback(
    (jobId: string, patch: Partial<DemoJob>) => {
      setStore((current) => ({
        ...current,
        jobs: current.jobs.map((job) => (job.id === jobId ? { ...job, ...patch } : job)),
      }));
    },
    []
  );

  const updateUser = useCallback((patch: Partial<DemoUser>) => {
    setStore((current) => ({ ...current, user: { ...current.user, ...patch } }));
  }, []);

  const createAccount = useCallback(
    (input: { account_name: string; account_purpose: string; cash_balance: number }) => {
      const nextAccount: DemoAccount = {
        id: createId("acct"),
        account_name: input.account_name,
        account_purpose: input.account_purpose,
        cash_balance: roundCurrency(input.cash_balance),
      };

      setStore((current) => ({
        ...current,
        accounts: [...current.accounts, nextAccount],
      }));

      return nextAccount;
    },
    []
  );

  const updateAccount = useCallback(
    (
      accountId: string,
      patch: Partial<Pick<DemoAccount, "account_name" | "account_purpose" | "cash_balance">>
    ) => {
      setStore((current) => ({
        ...current,
        accounts: current.accounts.map((account) =>
          account.id === accountId
            ? {
                ...account,
                ...patch,
                cash_balance:
                  patch.cash_balance === undefined ? account.cash_balance : roundCurrency(patch.cash_balance),
              }
            : account
        ),
      }));
    },
    []
  );

  const deleteAccount = useCallback((accountId: string) => {
    setStore((current) => ({
      ...current,
      accounts: current.accounts.filter((account) => account.id !== accountId),
      positions: current.positions.filter((position) => position.account_id !== accountId),
    }));
  }, []);

  const addPosition = useCallback((input: { account_id: string; symbol: string; quantity: number }) => {
    const normalizedSymbol = input.symbol.toUpperCase();
    const nextPosition: DemoPosition = {
      id: createId("pos"),
      account_id: input.account_id,
      symbol: normalizedSymbol,
      quantity: roundCurrency(input.quantity),
    };

    setStore((current) => ({
      ...current,
      positions: [...current.positions, nextPosition],
    }));
  }, []);

  const updatePosition = useCallback((positionId: string, quantity: number) => {
    setStore((current) => ({
      ...current,
      positions: current.positions.map((position) =>
        position.id === positionId ? { ...position, quantity: roundCurrency(quantity) } : position
      ),
    }));
  }, []);

  const deletePosition = useCallback((positionId: string) => {
    setStore((current) => ({
      ...current,
      positions: current.positions.filter((position) => position.id !== positionId),
    }));
  }, []);

  const populateTestData = useCallback(() => {
    setStore(createSeedStore());
  }, []);

  const resetAccounts = useCallback(() => {
    setStore((current) => ({
      ...current,
      accounts: [],
      positions: [],
    }));
  }, []);

  const startAnalysis = useCallback(() => {
    const jobId = createId("job");
    const analysisArtifacts = buildAnalysisArtifacts(store);
    const createdAt = new Date().toISOString();

    setStore((current) => ({
      ...current,
      jobs: [
        {
          id: jobId,
          created_at: createdAt,
          status: "pending",
          job_type: "portfolio",
        },
        ...current.jobs,
      ],
    }));

    emitAnalysisStarted(jobId);

    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        updateJob(jobId, { status: "running" });
      }, 1200);

      window.setTimeout(() => {
        updateJob(jobId, {
          status: "completed",
          ...analysisArtifacts,
        });
        emitAnalysisCompleted(jobId);
      }, 5200);
    }

    return jobId;
  }, [store, updateJob]);

  const value = useMemo<DemoContextValue>(
    () => ({
      ready,
      user: store.user,
      instruments: store.instruments,
      accounts: store.accounts,
      positions: store.positions,
      jobs: store.jobs,
      updateUser,
      getAccountById: (accountId: string) => store.accounts.find((account) => account.id === accountId),
      getPositionsForAccount: (accountId: string) =>
        store.positions.filter((position) => position.account_id === accountId),
      getInstrumentBySymbol: (symbol: string) =>
        store.instruments.find((instrument) => instrument.symbol === symbol),
      getJobById: (jobId: string) => store.jobs.find((job) => job.id === jobId),
      getLatestCompletedJob: () => store.jobs.find((job) => job.status === "completed"),
      createAccount,
      updateAccount,
      deleteAccount,
      addPosition,
      updatePosition,
      deletePosition,
      populateTestData,
      resetAccounts,
      startAnalysis,
    }),
    [
      ready,
      store,
      updateUser,
      createAccount,
      updateAccount,
      deleteAccount,
      addPosition,
      updatePosition,
      deletePosition,
      populateTestData,
      resetAccounts,
      startAnalysis,
    ]
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemoData() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemoData must be used inside DemoProvider");
  }
  return context;
}
