import "@/index.css";
import { useToolInfo } from "../helpers.js";

const STAGE_COLORS: Record<string, string> = {
  NEW: "#60a5fa", SCREENING: "#a78bfa", MEETING: "#fbbf24",
  PROPOSAL: "#fb923c", CUSTOMER: "#4ade80", CHURNED: "#f87171",
};

const STATUS_COLORS: Record<string, string> = {
  TODO: "#fbbf24", IN_PROGRESS: "#60a5fa", DONE: "#4ade80",
};

export default function CRM() {
  const { output } = useToolInfo<"show_crm">();

  if (!output) return <div className="dash"><p className="text-muted">Ładowanie...</p></div>;

  const { people, companies, opportunities, tasks } = output;

  const peopleList: any[] = Array.isArray(people) ? people : [];
  const companiesList: any[] = Array.isArray(companies) ? companies : [];
  const oppList: any[] = Array.isArray(opportunities) ? opportunities : [];
  const taskList: any[] = Array.isArray(tasks) ? tasks : [];

  const todoCount = taskList.filter(t => t.status === "TODO").length;

  return (
    <div className="dash" data-llm={`CRM: ${peopleList.length} kontaktów, ${companiesList.length} firm, ${oppList.length} szans, ${todoCount} zadań TODO`}>
      <h1 className="dash-title">👥 CRM Twenty</h1>

      {/* Summary */}
      <div className="grid-4">
        {[
          { label: "Kontakty", value: peopleList.length, icon: "👤", color: "#60a5fa" },
          { label: "Firmy", value: companiesList.length, icon: "🏢", color: "#a78bfa" },
          { label: "Szanse", value: oppList.length, icon: "💼", color: "#fbbf24" },
          { label: "Zadania TODO", value: todoCount, icon: "✅", color: "#4ade80" },
        ].map(s => (
          <div key={s.label} className="card stat" style={{ marginBottom: 0 }}>
            <div className="stat-value" style={{ color: s.color }}>{s.icon} {s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2 section-gap">
        {/* People */}
        <div className="card">
          <div className="card-title">👤 Kontakty</div>
          {peopleList.length === 0 ? (
            <p className="text-muted text-sm">Brak kontaktów</p>
          ) : (
            peopleList.slice(0, 8).map((p: any, i: number) => (
              <div key={i} className="row">
                <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#2d3348", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>
                  {((p.firstName ?? p.first_name ?? "?")[0] ?? "?").toUpperCase()}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div className="truncate text-sm" style={{ fontWeight: 600 }}>
                    {p.firstName ?? p.first_name} {p.lastName ?? p.last_name}
                  </div>
                  {p.email && <div className="text-xs text-muted truncate">{p.email}</div>}
                </div>
                {p.city && <span className="text-xs text-muted" style={{ marginLeft: "auto", whiteSpace: "nowrap" }}>{p.city}</span>}
              </div>
            ))
          )}
          {peopleList.length > 8 && <p className="text-muted text-xs" style={{ marginTop: 6 }}>+{peopleList.length - 8} więcej</p>}
        </div>

        {/* Companies */}
        <div className="card">
          <div className="card-title">🏢 Firmy</div>
          {companiesList.length === 0 ? (
            <p className="text-muted text-sm">Brak firm</p>
          ) : (
            companiesList.slice(0, 8).map((c: any, i: number) => (
              <div key={i} className="row">
                <span className="text-blue" style={{ fontSize: 18 }}>🏢</span>
                <div style={{ minWidth: 0 }}>
                  <div className="truncate text-sm" style={{ fontWeight: 600 }}>{c.name}</div>
                  {c.city && <div className="text-xs text-muted">{c.city}</div>}
                </div>
                {c.employees > 0 && (
                  <span className="text-xs text-muted" style={{ marginLeft: "auto" }}>{c.employees} os.</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Opportunities */}
      {oppList.length > 0 && (
        <div className="card section-gap">
          <div className="card-title">💼 Szanse sprzedażowe</div>
          <table className="table">
            <thead>
              <tr><th>Nazwa</th><th>Etap</th><th style={{ textAlign: "right" }}>Wartość</th><th>Zamknięcie</th></tr>
            </thead>
            <tbody>
              {oppList.map((o: any, i: number) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{o.name}</td>
                  <td>
                    <span className="badge" style={{ background: `${STAGE_COLORS[o.stage] ?? "#94a3b8"}20`, color: STAGE_COLORS[o.stage] ?? "#94a3b8", border: `1px solid ${STAGE_COLORS[o.stage] ?? "#94a3b8"}` }}>
                      {o.stage ?? "–"}
                    </span>
                  </td>
                  <td className="font-mono" style={{ textAlign: "right" }}>
                    {o.amount != null ? o.amount.toLocaleString("pl-PL", { style: "currency", currency: o.currency ?? "PLN" }) : "–"}
                  </td>
                  <td className="text-muted text-xs">{o.closeDate ?? o.close_date ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tasks */}
      {taskList.length > 0 && (
        <div className="card section-gap">
          <div className="card-title">✅ Zadania</div>
          <table className="table">
            <thead>
              <tr><th>Zadanie</th><th>Status</th><th>Termin</th></tr>
            </thead>
            <tbody>
              {taskList.slice(0, 12).map((t: any, i: number) => (
                <tr key={i}>
                  <td>{t.title ?? t.name}</td>
                  <td>
                    <span className="badge" style={{ background: `${STATUS_COLORS[t.status] ?? "#94a3b8"}20`, color: STATUS_COLORS[t.status] ?? "#94a3b8", border: `1px solid ${STATUS_COLORS[t.status] ?? "#94a3b8"}` }}>
                      {t.status ?? "–"}
                    </span>
                  </td>
                  <td className="text-muted text-xs">{t.dueAt ? new Date(t.dueAt).toLocaleDateString("pl-PL") : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
