import "@/index.css";
import { useToolInfo } from "../helpers.js";

function fmt(n: number, currency = "PLN") {
  return n?.toLocaleString("pl-PL", { style: "currency", currency, minimumFractionDigits: 2 });
}

function colorNum(n: number) {
  return n >= 0 ? { color: "#4ade80" } : { color: "#f87171" };
}

export default function Finances() {
  const { output } = useToolInfo<"show_finances">();

  if (!output) return <div className="dash"><p className="text-muted">Ładowanie...</p></div>;

  const { accounts, balance, income, holdings, transactions } = output;

  const accountList: any[] = Array.isArray(accounts) ? accounts : [];
  const bal: any = balance || {};
  const inc: any = income || {};
  const holdingList: any[] = Array.isArray(holdings) ? holdings : [];
  const txList: any[] = Array.isArray((transactions as any)?.transactions)
    ? (transactions as any).transactions
    : Array.isArray(transactions) ? transactions : [];

  const netWorth = bal.net_worth ?? bal.netWorth ?? bal.total_assets_minus_liabilities;
  const totalAssets = bal.total_assets ?? bal.assets;
  const totalLiabilities = bal.total_liabilities ?? bal.liabilities;

  return (
    <div className="dash" data-llm={`Finanse: net worth ${netWorth}, ${accountList.length} kont, ${txList.length} ostatnich transakcji`}>
      <h1 className="dash-title">💰 Finanse</h1>

      {/* Balance summary */}
      <div className="card">
        <div className="card-title">📊 Bilans</div>
        <div className="grid-3">
          {[
            { label: "Net Worth", value: netWorth, positive: (netWorth ?? 0) >= 0 },
            { label: "Aktywa", value: totalAssets, positive: true },
            { label: "Pasywa", value: totalLiabilities, positive: false },
          ].map(item => (
            <div key={item.label} className="stat">
              <div className="stat-value" style={colorNum(item.positive ? 1 : -1)}>
                {item.value != null ? fmt(item.value) : "–"}
              </div>
              <div className="stat-label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Accounts */}
      {accountList.length > 0 && (
        <div className="card">
          <div className="card-title">🏦 Konta ({accountList.length})</div>
          <table className="table">
            <thead>
              <tr><th>Konto</th><th>Typ</th><th style={{ textAlign: "right" }}>Saldo</th></tr>
            </thead>
            <tbody>
              {accountList.map((a: any, i: number) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{a.name ?? a.account_name}</td>
                  <td className="text-muted">{a.account_type ?? a.type ?? "–"}</td>
                  <td style={{ textAlign: "right", ...colorNum(a.balance ?? 0) }} className="font-mono">
                    {fmt(a.balance ?? 0, a.currency ?? "PLN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Income/Expense */}
      {(inc.income != null || inc.expenses != null) && (
        <div className="card">
          <div className="card-title">📈 Przychody / Wydatki</div>
          <div className="grid-2">
            <div className="stat">
              <div className="stat-value text-green">{fmt(inc.income ?? inc.total_income ?? 0)}</div>
              <div className="stat-label">Przychody</div>
            </div>
            <div className="stat">
              <div className="stat-value text-red">{fmt(inc.expenses ?? inc.total_expenses ?? 0)}</div>
              <div className="stat-label">Wydatki</div>
            </div>
          </div>
        </div>
      )}

      {/* Holdings */}
      {holdingList.length > 0 && (
        <div className="card">
          <div className="card-title">📉 Portfel inwestycyjny</div>
          <table className="table">
            <thead>
              <tr><th>Symbol</th><th>Nazwa</th><th style={{ textAlign: "right" }}>Ilość</th><th style={{ textAlign: "right" }}>Wartość</th></tr>
            </thead>
            <tbody>
              {holdingList.map((h: any, i: number) => (
                <tr key={i}>
                  <td className="font-mono text-blue">{h.symbol ?? h.ticker}</td>
                  <td className="truncate" style={{ maxWidth: 160 }}>{h.name ?? "–"}</td>
                  <td className="font-mono" style={{ textAlign: "right" }}>{h.quantity ?? h.shares ?? "–"}</td>
                  <td className="font-mono" style={{ textAlign: "right", ...colorNum(1) }}>{h.value != null ? fmt(h.value, h.currency ?? "PLN") : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Transactions */}
      {txList.length > 0 && (
        <div className="card">
          <div className="card-title">💳 Ostatnie transakcje</div>
          <table className="table">
            <thead>
              <tr><th>Opis</th><th>Data</th><th>Kategoria</th><th style={{ textAlign: "right" }}>Kwota</th></tr>
            </thead>
            <tbody>
              {txList.slice(0, 15).map((t: any, i: number) => {
                const isExpense = t.nature === "expense" || (t.amount ?? 0) < 0;
                const amount = Math.abs(t.amount ?? 0);
                return (
                  <tr key={i}>
                    <td className="truncate" style={{ maxWidth: 200 }}>{t.name ?? t.description ?? t.memo}</td>
                    <td className="text-muted text-xs">{t.date ?? "–"}</td>
                    <td className="text-muted text-xs">{t.category ?? "–"}</td>
                    <td className="font-mono" style={{ textAlign: "right", ...colorNum(isExpense ? -1 : 1) }}>
                      {isExpense ? "-" : "+"}{fmt(amount, t.currency ?? "PLN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
