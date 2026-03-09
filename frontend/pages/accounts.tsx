import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";

import ConfirmModal from "../components/ConfirmModal";
import Layout from "../components/Layout";
import { useDemoData } from "../lib/demo-data";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    value
  );
}

export default function Accounts() {
  const {
    ready,
    accounts,
    positions,
    getInstrumentBySymbol,
    createAccount,
    deleteAccount,
    populateTestData,
    resetAccounts,
  } = useDemoData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<{ id: string; name: string } | null>(null);
  const [newAccount, setNewAccount] = useState({ name: "", purpose: "", cashBalance: "" });

  const accountSummaries = useMemo(() => {
    return accounts.map((account) => {
      const accountPositions = positions.filter((position) => position.account_id === account.id);
      const positionsValue = accountPositions.reduce((sum, position) => {
        const instrument = getInstrumentBySymbol(position.symbol);
        return sum + position.quantity * (instrument?.current_price || 0);
      }, 0);

      return {
        ...account,
        positionsCount: accountPositions.length,
        totalValue: Number(account.cash_balance) + positionsValue,
      };
    });
  }, [accounts, positions, getInstrumentBySymbol]);

  const handleAddAccount = () => {
    if (!newAccount.name.trim()) {
      return;
    }

    createAccount({
      account_name: newAccount.name.trim(),
      account_purpose: newAccount.purpose.trim() || "Long-term investing",
      cash_balance: Number(newAccount.cashBalance || 0),
    });
    setNewAccount({ name: "", purpose: "", cashBalance: "" });
    setShowAddModal(false);
  };

  if (!ready) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-600">Loading demo accounts...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Accounts | Alex Demo</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-primary font-semibold">Portfolio accounts</p>
            <h1 className="text-3xl font-bold text-dark">Manage demo holdings</h1>
            <p className="text-gray-600 mt-2">Add, remove, and reset accounts to tailor the story you want to show the client.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => populateTestData()}
              className="rounded-lg border border-primary px-5 py-3 text-primary font-semibold hover:bg-primary hover:text-white"
            >
              Restore Seed Data
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="rounded-lg border border-red-300 px-5 py-3 text-red-600 font-semibold hover:bg-red-50"
            >
              Clear Accounts
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded-lg bg-primary px-5 py-3 text-white font-semibold hover:bg-blue-600"
            >
              Add Account
            </button>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-2">Active accounts</p>
            <p className="text-3xl font-bold text-dark">{accountSummaries.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-2">Tracked positions</p>
            <p className="text-3xl font-bold text-dark">{positions.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-2">Combined value</p>
            <p className="text-3xl font-bold text-dark">
              {formatCurrency(accountSummaries.reduce((sum, account) => sum + account.totalValue, 0))}
            </p>
          </div>
        </section>

        <section className="space-y-4">
          {accountSummaries.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
              <h2 className="text-2xl font-bold text-dark mb-3">No accounts loaded</h2>
              <p className="text-gray-600 mb-6">Restore the seeded dataset or create a lightweight custom scenario.</p>
              <button
                onClick={() => populateTestData()}
                className="rounded-lg bg-primary px-6 py-3 text-white font-semibold hover:bg-blue-600"
              >
                Restore Seed Data
              </button>
            </div>
          ) : (
            accountSummaries.map((account) => (
              <div key={account.id} className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-dark">{account.account_name}</h2>
                    <p className="text-gray-600">{account.account_purpose}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/accounts/${account.id}`}
                      className="rounded-lg border border-primary px-4 py-2 text-primary font-semibold hover:bg-primary hover:text-white"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => setAccountToDelete({ id: account.id, name: account.account_name })}
                      className="rounded-lg border border-red-300 px-4 py-2 text-red-600 font-semibold hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500 mb-1">Cash balance</p>
                    <p className="text-xl font-semibold text-dark">{formatCurrency(Number(account.cash_balance))}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500 mb-1">Positions</p>
                    <p className="text-xl font-semibold text-dark">{account.positionsCount}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500 mb-1">Estimated total</p>
                    <p className="text-xl font-semibold text-dark">{formatCurrency(account.totalValue)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      <ConfirmModal
        isOpen={showAddModal}
        title="Add demo account"
        message={
          <div className="space-y-4">
            <input
              placeholder="Account name"
              value={newAccount.name}
              onChange={(event) => setNewAccount((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
            <input
              placeholder="Purpose"
              value={newAccount.purpose}
              onChange={(event) => setNewAccount((current) => ({ ...current, purpose: event.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
            <input
              placeholder="Cash balance"
              type="number"
              value={newAccount.cashBalance}
              onChange={(event) => setNewAccount((current) => ({ ...current, cashBalance: event.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
        }
        confirmText="Create"
        onConfirm={handleAddAccount}
        onCancel={() => setShowAddModal(false)}
      />

      <ConfirmModal
        isOpen={showResetConfirm}
        title="Clear all accounts?"
        message="This removes all demo accounts and positions from the current browser session. You can restore the seeded dataset at any time."
        confirmText="Clear"
        onConfirm={() => {
          resetAccounts();
          setShowResetConfirm(false);
        }}
        onCancel={() => setShowResetConfirm(false)}
      />

      <ConfirmModal
        isOpen={Boolean(accountToDelete)}
        title="Delete account?"
        message={`Remove ${accountToDelete?.name || "this account"} and all of its positions from the demo?`}
        confirmText="Delete"
        onConfirm={() => {
          if (accountToDelete) {
            deleteAccount(accountToDelete.id);
          }
          setAccountToDelete(null);
        }}
        onCancel={() => setAccountToDelete(null)}
      />
    </Layout>
  );
}
