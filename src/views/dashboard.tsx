import "@/index.css";
import { useToolInfo } from "../helpers.js";

function pct(used: number, total: number) {
  if (!total) return 0;
  return Math.round((used / total) * 100);
}

function StatusDot({ ok }: { ok: boolean }) {
  return <span className={`dot ${ok ? "dot-green" : "dot-red"}`} />;
}

export default function Dashboard() {
  const { output } = useToolInfo<"show_dashboard">();
  if (!output) return <div className="dash"><p className="text-muted">Ładowanie...</p></div>;

  const { containers, resources, haStatus, emails, balance, backups, docs, tasks } = output;

  const vms = Array.isArray(containers) ? containers : [];
  const running = vms.filter((v: any) => v.status === "running").length;

  const res: any = resources || {};
  const cpuPct = Math.round((res.cpu ?? 0) * 100);
  const ramPct = pct(res.memory?.used ?? 0, res.memory?.total ?? 1);
  const diskPct = pct(res.disk?.used ?? 0, res.disk?.total ?? 1);

  const haOk = !(haStatus as any)?.error;

  const todayEmails = Array.isArray(emails) ? emails : [];

  const bal: any = balance || {};
  const netWorth = bal.net_worth ?? bal.netWorth ?? bal.total ?? "–";

  const backupOk = !(backups as any)?.error && (backups as any)?.all_fresh !== false;

  const recentDocs = Array.isArray(docs) ? docs : [];
  const todoTasks = Array.isArray(tasks) ? tasks : [];

  return (
    <div className="dash" data-llm={`Dashboard: ${running}/${vms.length} VM uruchomionych, CPU ${cpuPct}%, RAM ${ramPct}%, ${todayEmails.length} maili dziś`}>
      <h1 className="dash-title">🏠 Dashboard</h1>

      {/* Proxmox strip */}
      <div className="card">
        <div className="card-title">🖥️ Proxmox</div>
        <div className="grid-4">
          <div className="stat">
            <div className="stat-value">{running}/{vms.length}</div>
            <div className="stat-label">VM uruchomionych</div>
          </div>
          <div className="stat">
            <div className="stat-value" style={{ color: cpuPct > 80 ? "#f87171" : "#4ade80" }}>{cpuPct}%</div>
            <div className="stat-label">CPU</div>
          </div>
          <div className="stat">
            <div className="stat-value" style={{ color: ramPct > 80 ? "#f87171" : "#60a5fa" }}>{ramPct}%</div>
            <div className="stat-label">RAM</div>
          </div>
          <div className="stat">
            <div className="stat-value" style={{ color: diskPct > 80 ? "#f87171" : "#a78bfa" }}>{diskPct}%</div>
            <div className="stat-label">Dysk</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Services status */}
        <div className="card">
          <div className="card-title">⚙️ Serwisy</div>
          {[
            { name: "Home Assistant", ok: haOk },
            { name: "Backupy rclone", ok: backupOk },
            { name: "Proxmox", ok: !((containers as any)?.error) },
            { name: "Finanse (Sure)", ok: !((balance as any)?.error) },
          ].map(s => (
            <div key={s.name} className="row">
              <StatusDot ok={s.ok} />
              <span>{s.name}</span>
              <span className="text-muted text-xs" style={{ marginLeft: "auto" }}>
                {s.ok ? "OK" : "błąd"}
              </span>
            </div>
          ))}
        </div>

        {/* Email */}
        <div className="card">
          <div className="card-title">📧 E-mail dziś</div>
          {todayEmails.length === 0 ? (
            <p className="text-muted text-sm">Brak maili dziś</p>
          ) : (
            todayEmails.slice(0, 4).map((m: any, i: number) => (
              <div key={i} className="row">
                <span className="truncate" style={{ maxWidth: 200 }}>{m.subject ?? "(brak tematu)"}</span>
                <span className="text-muted text-xs" style={{ marginLeft: "auto", whiteSpace: "nowrap" }}>{m.from?.split("<")[0].trim()}</span>
              </div>
            ))
          )}
          {todayEmails.length > 4 && (
            <p className="text-muted text-xs" style={{ marginTop: 6 }}>+{todayEmails.length - 4} więcej</p>
          )}
        </div>
      </div>

      <div className="grid-2">
        {/* Finance */}
        <div className="card">
          <div className="card-title">💰 Finanse</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#4ade80" }}>
            {typeof netWorth === "number" ? netWorth.toLocaleString("pl-PL", { style: "currency", currency: "PLN" }) : netWorth}
          </div>
          <div className="text-muted text-xs" style={{ marginTop: 4 }}>Net worth</div>
        </div>

        {/* Tasks */}
        <div className="card">
          <div className="card-title">✅ Zadania TODO ({todoTasks.length})</div>
          {todoTasks.length === 0 ? (
            <p className="text-muted text-sm">Brak zadań</p>
          ) : (
            todoTasks.slice(0, 4).map((t: any, i: number) => (
              <div key={i} className="row">
                <span className="dot dot-yellow" />
                <span className="truncate">{t.title ?? t.name}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent docs */}
      {recentDocs.length > 0 && (
        <div className="card">
          <div className="card-title">📄 Ostatnie dokumenty</div>
          <div className="grid-2">
            {recentDocs.slice(0, 4).map((d: any, i: number) => (
              <div key={i} className="row">
                <span className="text-blue">📄</span>
                <span className="truncate text-sm">{d.title ?? d.correspondent ?? d.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
