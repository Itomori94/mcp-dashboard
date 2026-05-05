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
  const vms: any[] = Array.isArray(containers) ? containers : [];
  const res: any = resources || {};
  const storageList: any[] = Array.isArray(storage) ? storage : [];
  const taskList: any[] = Array.isArray(tasks) ? tasks : [];

  const cpuPct = Math.round((res.cpu ?? 0) * 100);
  const ramPct = pct(res.memory?.used ?? 0, res.memory?.total ?? 1);
  const diskPct = pct(res.disk?.used ?? 0, res.disk?.total ?? 1);

  const running = vms.filter(v => v.status === "running").length;

  function statusBadge(s: string) {
    if (s === "running") return <span className="badge badge-green">▶ running</span>;
    if (s === "stopped") return <span className="badge badge-red">■ stopped</span>;
    return <span className="badge badge-gray">{s}</span>;
  }

  function typeBadge(t: string) {
    return t === "qemu"
      ? <span className="badge badge-blue">VM</span>
      : <span className="badge badge-yellow">LXC</span>;
  }

  return (
    <div className="dash" data-llm={`Proxmox: ${running}/${vms.length} uruchomionych, CPU ${cpuPct}%, RAM ${ramPct}%, Dysk ${diskPct}%`}>
      <h1 className="dash-title">🖥️ Proxmox</h1>

      {/* Node resources */}
      <div className="card">
        <div className="card-title">📊 Zasoby węzła</div>
        <div className="grid-3">
          {[
            { label: "CPU", value: cpuPct },
            { label: "RAM", value: ramPct },
            { label: "Dysk", value: diskPct },
          ].map(r => (
            <div key={r.label} style={{ padding: "4px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span className="text-sm">{r.label}</span>
                <span className="text-sm font-mono">{r.value}%</span>
              </div>
              <Bar value={r.value} />
            </div>
          ))}
        </div>
      </div>

      {/* Containers/VMs */}
      <div className="card">
        <div className="card-title">🗂️ Kontenery i VM ({vms.length})</div>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nazwa</th>
              <th>Typ</th>
              <th>Status</th>
              <th>CPU</th>
              <th>RAM</th>
            </tr>
          </thead>
          <tbody>
            {vms.map((v: any) => (
              <tr key={v.vmid}>
                <td className="font-mono text-muted">{v.vmid}</td>
                <td style={{ fontWeight: 600 }}>{v.name}</td>
                <td>{typeBadge(v.type ?? (v.vmid < 200 ? "qemu" : "lxc"))}</td>
                <td>{statusBadge(v.status)}</td>
                <td className="font-mono">{v.cpu !== undefined ? `${Math.round(v.cpu * 100)}%` : "–"}</td>
                <td className="font-mono">{v.mem !== undefined && v.maxmem ? `${Math.round(v.mem / 1024 / 1024)}/${Math.round(v.maxmem / 1024 / 1024)} MB` : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Storage */}
      {storageList.length > 0 && (
        <div className="card">
          <div className="card-title">💾 Storage</div>
          <table className="table">
            <thead>
              <tr><th>Nazwa</th><th>Typ</th><th>Użyte</th><th>Dostępne</th><th>%</th></tr>
            </thead>
            <tbody>
              {storageList.map((s: any, i: number) => {
                const usedPct = pct(s.used ?? 0, s.total ?? 1);
                return (
                  <tr key={i}>
                    <td className="font-mono">{s.storage ?? s.name}</td>
                    <td className="text-muted">{s.type}</td>
                    <td className="font-mono">{s.used_human ?? `${Math.round((s.used ?? 0) / 1073741824)} GB`}</td>
                    <td className="font-mono">{s.avail_human ?? `${Math.round((s.avail ?? 0) / 1073741824)} GB`}</td>
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

      {/* Recent tasks */}
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
                  <td>
                    {t.status === "OK"
                      ? <span className="badge badge-green">OK</span>
                      : <span className="badge badge-red">{t.status}</span>}
                  </td>
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
