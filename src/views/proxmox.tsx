import "@/index.css";
import { useToolInfo } from "../helpers.js";

function pct(used: number, total: number) {
  if (!total) return 0;
  return Math.round((used / total) * 100);
}

function Bar({ value }: { value: number }) {
  const color = value > 85 ? "#ef4444" : value > 60 ? "#f59e0b" : "#22c55e";
  return (
    <div className="progress">
      <div className="progress-fill" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

export default function Proxmox() {
  const { output } = useToolInfo<"show_proxmox">();

  if (!output) return <div className="dash"><p className="text-muted">Ładowanie...</p></div>;

  const { containers, resources, storage, tasks } = output;

  // containers: array of { vmid, name, type: "LXC"|"VM", status, cpu: "0.1%", ram_mb }
  const vms: any[] = Array.isArray(containers) ? containers : [];

  // resources: { cpu_usage: "6.8%", cpu_cores, ram_used_gb, ram_total_gb, disk_used_gb, disk_total_gb, uptime_h }
  const res: any = resources || {};
  const cpuPct = parseFloat(String(res.cpu_usage ?? "0"));
  const ramPct = pct(res.ram_used_gb ?? 0, res.ram_total_gb ?? 1);
  const diskPct = pct(res.disk_used_gb ?? 0, res.disk_total_gb ?? 1);

  // storage: array of { storage, type, used_gb, total_gb, free_gb }
  const storageList: any[] = Array.isArray(storage) ? storage : storage ? [storage] : [];

  const taskList: any[] = Array.isArray(tasks) ? tasks : [];
  const running = vms.filter(v => v.status === "running").length;

  function statusBadge(s: string) {
    if (s === "running") return <span className="badge badge-green">▶ running</span>;
    if (s === "stopped") return <span className="badge badge-red">■ stopped</span>;
    return <span className="badge badge-gray">{s}</span>;
  }

  function typeBadge(t: string) {
    return t === "VM"
      ? <span className="badge badge-blue">VM</span>
      : <span className="badge badge-yellow">LXC</span>;
  }

  return (
    <div className="dash" data-llm={`Proxmox: ${running}/${vms.length} uruchomionych, CPU ${cpuPct}%, RAM ${ramPct}%, Dysk ${diskPct}%`}>
      <h1 className="dash-title">🖥️ Proxmox</h1>

      <div className="card">
        <div className="card-title">
          📊 Zasoby węzła
          {res.cpu_cores && <span className="text-muted" style={{ fontWeight: 400, marginLeft: 8 }}>({res.cpu_cores} rdzeni · uptime {Math.round(res.uptime_h ?? 0)}h)</span>}
        </div>
        <div className="grid-3">
          {[
            { label: "CPU", value: cpuPct, raw: res.cpu_usage ?? "–" },
            { label: "RAM", value: ramPct, raw: `${res.ram_used_gb} / ${res.ram_total_gb} GB` },
            { label: "Dysk", value: diskPct, raw: `${res.disk_used_gb} / ${res.disk_total_gb} GB` },
          ].map(r => (
            <div key={r.label} style={{ padding: "4px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span className="text-sm">{r.label}</span>
                <span className="text-sm font-mono">{r.raw}</span>
              </div>
              <Bar value={r.value} />
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">🗂️ Kontenery i VM ({vms.length}) — {running} uruchomionych</div>
        <table className="table">
          <thead>
            <tr><th>ID</th><th>Nazwa</th><th>Typ</th><th>Status</th><th>CPU</th><th>RAM</th></tr>
          </thead>
          <tbody>
            {vms.map((v: any) => (
              <tr key={v.vmid}>
                <td className="font-mono text-muted">{v.vmid}</td>
                <td style={{ fontWeight: 600 }}>{v.name}</td>
                <td>{typeBadge(v.type ?? "LXC")}</td>
                <td>{statusBadge(v.status)}</td>
                <td className="font-mono">{v.cpu ?? "–"}</td>
                <td className="font-mono">{v.ram_mb != null ? `${v.ram_mb} MB` : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {storageList.length > 0 && (
        <div className="card">
          <div className="card-title">💾 Storage</div>
          <table className="table">
            <thead>
              <tr><th>Nazwa</th><th>Typ</th><th>Użyte</th><th>Wolne</th><th>Łącznie</th><th>%</th></tr>
            </thead>
            <tbody>
              {storageList.map((s: any, i: number) => {
                const usedPct = pct(s.used_gb ?? 0, s.total_gb ?? 1);
                return (
                  <tr key={i}>
                    <td className="font-mono">{s.storage}</td>
                    <td className="text-muted">{s.type}</td>
                    <td className="font-mono">{s.used_gb} GB</td>
                    <td className="font-mono">{s.free_gb} GB</td>
                    <td className="font-mono">{s.total_gb} GB</td>
                    <td style={{ minWidth: 80 }}>
                      <span className="font-mono text-xs" style={{ float: "right" }}>{usedPct}%</span>
                      <Bar value={usedPct} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {taskList.length > 0 && (
        <div className="card">
          <div className="card-title">📋 Ostatnie zadania</div>
          <table className="table">
            <thead>
              <tr><th>Typ</th><th>VM</th><th>Status</th><th>Czas</th></tr>
            </thead>
            <tbody>
              {taskList.slice(0, 8).map((t: any, i: number) => (
                <tr key={i}>
                  <td className="font-mono text-sm">{t.type}</td>
                  <td className="font-mono">{t.id ?? "–"}</td>
                  <td>{t.status === "OK" ? <span className="badge badge-green">OK</span> : <span className="badge badge-red">{t.status}</span>}</td>
                  <td className="text-muted text-xs">{t.starttime ? new Date(t.starttime * 1000).toLocaleString("pl-PL") : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
