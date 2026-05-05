import "@/index.css";
import { useToolInfo } from "../helpers.js";

const DOMAIN_ICONS: Record<string, string> = {
  light: "💡", switch: "🔌", sensor: "🌡️", binary_sensor: "🔔",
  media_player: "📺", climate: "❄️", cover: "🪟", lock: "🔒",
  camera: "📷", automation: "⚡", script: "📜", person: "👤",
  device_tracker: "📍", weather: "🌤️",
};

function domainIcon(entity_id: string) {
  const domain = entity_id.split(".")[0];
  return DOMAIN_ICONS[domain] ?? "•";
}

function stateColor(state: string) {
  if (["on", "home", "unlocked", "open", "playing", "active"].includes(state)) return "#4ade80";
  if (["off", "away", "locked", "closed", "paused", "idle"].includes(state)) return "#64748b";
  if (["unavailable", "unknown"].includes(state)) return "#ef4444";
  return "#e2e8f0";
}

export default function HomeAssistant() {
  const { output } = useToolInfo<"show_home_assistant">();

  if (!output) return <div className="dash"><p className="text-muted">Ładowanie...</p></div>;

  const { status, entities } = output;
  const haStatus: any = status || {};
  const entityList: any[] = Array.isArray(entities) ? entities : [];

  const haOk = !(haStatus as any)?.error;

  // Group by domain
  const grouped: Record<string, any[]> = {};
  for (const e of entityList) {
    const domain = (e.entity_id ?? "").split(".")[0] || "other";
    (grouped[domain] ??= []).push(e);
  }

  const domains = Object.keys(grouped).sort((a, b) => {
    const order = ["light", "switch", "sensor", "climate", "media_player", "cover", "lock", "automation"];
    const ai = order.indexOf(a); const bi = order.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });

  const lightsOn = (grouped.light ?? []).filter((e: any) => e.state === "on").length;
  const switchesOn = (grouped.switch ?? []).filter((e: any) => e.state === "on").length;

  return (
    <div className="dash" data-llm={`Home Assistant: ${haOk ? "online" : "offline"}, ${lightsOn} świateł włączonych, ${entityList.length} encji`}>
      <h1 className="dash-title">🏠 Home Assistant</h1>

      {/* Status */}
      <div className="card">
        <div className="card-title">📡 Status</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div>
            <span className={`badge ${haOk ? "badge-green" : "badge-red"}`}>
              {haOk ? "● Online" : "● Offline"}
            </span>
          </div>
          {haStatus.version && <span className="text-muted text-sm">v{haStatus.version}</span>}
          <span className="text-muted text-sm">{entityList.length} encji załadowanych</span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid-4">
        {[
          { label: "Światła ON", value: lightsOn, icon: "💡", color: "#fbbf24" },
          { label: "Przełączniki ON", value: switchesOn, icon: "🔌", color: "#60a5fa" },
          { label: "Czujniki", value: (grouped.sensor ?? []).length, icon: "🌡️", color: "#a78bfa" },
          { label: "Automatyzacje", value: (grouped.automation ?? []).length, icon: "⚡", color: "#34d399" },
        ].map(s => (
          <div key={s.label} className="card stat" style={{ marginBottom: 0 }}>
            <div className="stat-value" style={{ color: s.color }}>{s.icon} {s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Entities per domain */}
      {domains.map(domain => (
        <div key={domain} className="card section-gap">
          <div className="card-title">
            {domainIcon(`${domain}.x`)} {domain.replace("_", " ")} ({grouped[domain].length})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 4 }}>
            {grouped[domain].slice(0, 20).map((e: any, i: number) => (
              <div key={i} className="row" style={{ padding: "4px 6px" }}>
                <span className="dot" style={{ background: stateColor(e.state ?? "") }} />
                <span className="truncate text-sm" title={e.entity_id}>{e.friendly_name ?? e.entity_id?.split(".")[1]}</span>
                <span className="text-xs font-mono" style={{ marginLeft: "auto", color: stateColor(e.state ?? ""), whiteSpace: "nowrap" }}>
                  {e.state}{e.attributes?.unit_of_measurement ? ` ${e.attributes.unit_of_measurement}` : ""}
                </span>
              </div>
            ))}
            {grouped[domain].length > 20 && (
              <p className="text-muted text-xs" style={{ padding: "4px 6px" }}>+{grouped[domain].length - 20} więcej</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
