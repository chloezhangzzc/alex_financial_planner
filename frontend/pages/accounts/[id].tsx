import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

import ConfirmModal from "../../components/ConfirmModal";
import Layout from "../../components/Layout";
import { useDemoData } from "../../lib/demo-data";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    value
  );
}

export default function AccountDetail() {
  const router = useRouter();
  const { id } = router.query;
  const {
    ready,
    instruments,
    getAccountById,
    getPositionsForAccount,
    getInstrumentBySymbol,
    updateAccount,
    addPosition,
    updatePosition,
    deletePosition,
  } = useDemoData();

  const accountId = typeof id === "string" ? id : "";
  const account = getAccountById(accountId);
  const positions = getPositionsForAccount(accountId);

  const [editingAccount, setEditingAccount] = useState(false);
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState({ name: "", purpose: "", cashBalance: "" });
  const [positionQuantity, setPositionQuantity] = useState("");
  const [newPosition, setNewPosition] = useState({ symbol: "", quantity: "" });
  const [positionToDelete, setPositionToDelete] = useState<{ id: string; symbol: string } | null>(null);

  useEffect(() => {
    if (account) {
      setAccountForm({
        name: account.account_name,
        purpose: account.account_purpose,
        cashBalance: String(account.cash_balance),
      });
    }
  }, [account]);

  const enrichedPositions = useMemo(() => {
    return positions.map((position) => {
      const instrument = getInstrumentBySymbol(position.symbol);
      return {
        ...position,
        instrument,
        marketValue: position.quantity * (instrument?.current_price || 0),
      };
    });
  }, [positions, getInstrumentBySymbol]);

  const totalValue = (account?.cash_balance || 0) + enrichedPositions.reduce((sum, position) => sum + position.marketValue, 0);

  const suggestedInstruments = instruments.filter((instrument) => {
    const search = newPosition.symbol.trim().toLowerCase();
    if (!search) {
      return true;
    }
    return (
      instrument.symbol.toLowerCase().includes(search) ||
      instrument.name.toLowerCase().includes(search)
    );
  });

  if (!ready) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-600">Loading account...</div>
        </div>
      </Layout>
    );
  }

  if (!account) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <h1 className="text-2xl font-bold text-dark mb-3">Account not found</h1>
            <Link href="/accounts" className="text-primary font-semibold hover:underline">
              Back to accounts
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{account.account_name} | Alex Demo</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/accounts" className="text-sm font-semibold text-primary hover:underline">
              Back to accounts
            </Link>
            <h1 className="text-3xl font-bold text-dark mt-2">{account.account_name}</h1>
            <p className="text-gray-600 mt-2">{account.account_purpose}</p>
          </div>
          <button
            onClick={() => {
              setAccountForm({
                name: account.account_name,
                purpose: account.account_purpose,
                cashBalance: String(account.cash_balance),
              });
              setEditingAccount(true);
            }}
            className="rounded-lg bg-primary px-5 py-3 text-white font-semibold hover:bg-blue-600"
          >
            Edit Account
          </button>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-2">Cash balance</p>
            <p className="text-3xl font-bold text-dark">{formatCurrency(account.cash_balance)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-2">Positions</p>
            <p className="text-3xl font-bold text-dark">{positions.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-2">Estimated total</p>
            <p className="text-3xl font-bold text-dark">{formatCurrency(totalValue)}</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-dark">Positions</h2>
              <p className="text-gray-600">Edit quantities or add an extra ETF to personalize the demo story.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto] text-sm font-semibold text-gray-500 border-b pb-3">
            <p>Instrument</p>
            <p>Quantity</p>
            <p>Market Value</p>
            <p>Actions</p>
          </div>

          <div className="mt-4 space-y-4">
            {enrichedPositions.map((position) => (
              <div key={position.id} className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto] items-center rounded-xl border border-gray-100 p-4">
                <div>
                  <p className="font-semibold text-dark">{position.symbol}</p>
                  <p className="text-sm text-gray-600">{position.instrument?.name || "Unknown instrument"}</p>
                </div>
                <div>
                  {editingPositionId === position.id ? (
                    <input
                      type="number"
                      value={positionQuantity}
                      onChange={(event) => setPositionQuantity(event.target.value)}
                      className="w-28 rounded-lg border border-gray-300 px-3 py-2"
                    />
                  ) : (
                    <p className="font-semibold text-dark">{position.quantity}</p>
                  )}
                </div>
                <p className="font-semibold text-dark">{formatCurrency(position.marketValue)}</p>
                <div className="flex flex-wrap gap-2">
                  {editingPositionId === position.id ? (
                    <>
                      <button
                        onClick={() => {
                          updatePosition(position.id, Number(positionQuantity));
                          setEditingPositionId(null);
                        }}
                        className="rounded-lg bg-primary px-3 py-2 text-white text-sm font-semibold hover:bg-blue-600"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingPositionId(null)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingPositionId(position.id);
                          setPositionQuantity(String(position.quantity));
                        }}
                        className="rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setPositionToDelete({ id: position.id, symbol: position.symbol })}
                        className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-dark mb-4">Add position</h2>
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.6fr_auto]">
            <div>
              <input
                value={newPosition.symbol}
                onChange={(event) => setNewPosition((current) => ({ ...current, symbol: event.target.value.toUpperCase() }))}
                placeholder="Symbol"
                className="w-full rounded-lg border border-gray-300 px-4 py-3"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestedInstruments.slice(0, 5).map((instrument) => (
                  <button
                    key={instrument.symbol}
                    onClick={() => setNewPosition((current) => ({ ...current, symbol: instrument.symbol }))}
                    className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200"
                  >
                    {instrument.symbol}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              value={newPosition.quantity}
              onChange={(event) => setNewPosition((current) => ({ ...current, quantity: event.target.value }))}
              placeholder="Quantity"
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
            />
            <button
              onClick={() => {
                if (!newPosition.symbol || !newPosition.quantity) {
                  return;
                }
                addPosition({
                  account_id: account.id,
                  symbol: newPosition.symbol,
                  quantity: Number(newPosition.quantity),
                });
                setNewPosition({ symbol: "", quantity: "" });
              }}
              className="rounded-lg bg-ai-accent px-5 py-3 text-white font-semibold hover:bg-purple-700"
            >
              Add
            </button>
          </div>
        </section>
      </div>

      <ConfirmModal
        isOpen={editingAccount}
        title="Edit account"
        message={
          <div className="space-y-4">
            <input
              value={accountForm.name}
              onChange={(event) => setAccountForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
            <input
              value={accountForm.purpose}
              onChange={(event) => setAccountForm((current) => ({ ...current, purpose: event.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
            <input
              type="number"
              value={accountForm.cashBalance}
              onChange={(event) => setAccountForm((current) => ({ ...current, cashBalance: event.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
        }
        confirmText="Save"
        onConfirm={() => {
          updateAccount(account.id, {
            account_name: accountForm.name,
            account_purpose: accountForm.purpose,
            cash_balance: Number(accountForm.cashBalance),
          });
          setEditingAccount(false);
        }}
        onCancel={() => setEditingAccount(false)}
      />

      <ConfirmModal
        isOpen={Boolean(positionToDelete)}
        title="Delete position?"
        message={`Remove ${positionToDelete?.symbol || "this position"} from the demo account?`}
        confirmText="Delete"
        onConfirm={() => {
          if (positionToDelete) {
            deletePosition(positionToDelete.id);
          }
          setPositionToDelete(null);
        }}
        onCancel={() => setPositionToDelete(null)}
      />
    </Layout>
  );
}
