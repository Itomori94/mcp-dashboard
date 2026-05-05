import "@/index.css";
import { useToolInfo } from "../helpers.js";

export default function Backups() {
  const { output } = useToolInfo<"show_backups">();

  if (!output) return <div className="dash"><p className="text-muted">Ładowanie...</p></div>;

  const { status, remotes, targets } = output;

  const statusData: any = status || {};
  const remoteList: string[] = Array.isArray(remotes)
    ? remotes
    : typeof remotes === "object" && remotes !== null
    ? Object.keys(remotes as object)
    : [];
  const targetList: any[] = Array.isArray(targets) ? targets : [];

  const targetResults: any[] = statusData.results ?? statusData.targets ?? [];
  const allFresh = statusData.all_fresh ?? statusData.all_ok;

  return (
    <div className="dash" data-llm={`Backupy: ${allFresh ? "wszystkie aktualne" : "uwaga - przestarzałe"}, ${remoteList.length} zdalnych zasobów`}>
      <h1 className="dash-title">💾 Kopie zapasowe</h1>

      {/* Overall status */}
      <div className="card">
        <div className="card-title">📊 Status ogólny</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className={`badge ${allFresh ? "badge-green" : allFresh === false ? "badge-red" : "badge-yellow"}`} style={{ fontSize: 14, padding: "6px 14px" }}>
            {allFresh ? "✓ Wszystkie backupy aktualne" : allFresh === false ? "⚠ Przestarzałe backupy!" : "? Status nieznany"}
          </span>
        </div>
        {statusData.message && (
          <p className="text-sm" style={{ marginTop: 10 }}>{statusData.message}</p>
        )}
      </div>

      {/* Target results */}
      {targetResults.length > 0 && (
        <div className="card section-gap">
          <div className="card-title">🎯 Targety backupu</div>
          <table className="table">
            <thead>
              <tr><th>Target</th><th>Status</th><th>Ostatni backup</th><th>Wiek</th></tr>
            </thead>
            <tbody>
              {targetResults.map((t: any, i: number) => (
                <tr key={i}>
                  <td className="font-mono text-sm">{t.target ?? t.path ?? t.name}</td>
                  <td>
                    {t.fresh || t.ok
                      ? <span className="badge badge-green">✓ Aktualny</span>
                      : <span className="badge badge-red">⚠ Stary</span>}
                  </td>
                  <td className="text-muted text-xs font-mono">{t.newest_file ?? t.last_backup ?? "–"}</td>
                  <td className="text-muted text-xs">
                    {t.age_hours != null ? `${Math.round(t.age_hours)}h temu` : "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Remotes */}
      {remoteList.length > 0 && (
        <div className="card section-gap">
          <div className="card-title">☁️ Zdalne zasoby rclone ({remoteList.length})</div>
          <div className="grid-2">
            {remoteList.map((r: string, i: number) => (
              <div key={i} className="row">
                <span style={{ fontSize: 18 }}>☁️</span>
                <span className="font-mono text-sm">{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configured targets */}
      {targetList.length > 0 && (
        <div className="card section-gap">
          <div className="card-title">⚙️ Skonfigurowane targety</div>
          {targetList.map((t: any, i: number) => (
            <div key={i} className="row">
              <span className="dot dot-blue" />
              <span className="font-mono text-sm">{typeof t === "string" ? t : t.target ?? t.path ?? JSON.stringify(t)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
