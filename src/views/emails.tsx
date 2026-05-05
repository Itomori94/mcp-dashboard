import "@/index.css";
import { useToolInfo } from "../helpers.js";

export default function Emails() {
  const { output } = useToolInfo<"show_emails">();

  if (!output) return <div className="dash"><p className="text-muted">Ładowanie...</p></div>;

  const { today, recent } = output;
  const todayList: any[] = Array.isArray(today) ? today : [];
  const recentList: any[] = Array.isArray(recent) ? recent : [];

  // Deduplicate recent vs today (fields: id, From, Subject, To, Date)
  const todayIds = new Set(todayList.map((m: any) => m.id ?? m.Subject));
  const olderList = recentList.filter((m: any) => !todayIds.has(m.id ?? m.Subject));

  function EmailRow({ m }: { m: any }) {
    const from = (m.From ?? m.from ?? "").replace(/<[^>]+>/, "").trim();
    const subject = m.Subject ?? m.subject ?? "(brak tematu)";
    const date = (m.Date ?? m.date)
      ? new Date(m.Date ?? m.date).toLocaleString("pl-PL", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
      : "";
    return (
      <div className="email-item">
        <div className="email-subject">{subject}</div>
        <div className="email-meta">
          <span>Od: {from || "–"}</span>
          {date && <span style={{ marginLeft: 12 }}>📅 {date}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="dash" data-llm={`Email: ${todayList.length} maili dziś, ${olderList.length} starszych`}>
      <h1 className="dash-title">📧 Skrzynka e-mail</h1>

      <div className="card">
        <div className="card-title">
          📬 Dziś ({todayList.length})
          {todayList.length === 0 && <span className="text-muted" style={{ fontWeight: 400, marginLeft: 8 }}>Brak maili</span>}
        </div>
        {todayList.map((m: any, i: number) => <EmailRow key={i} m={m} />)}
      </div>

      {olderList.length > 0 && (
        <div className="card section-gap">
          <div className="card-title">📫 Starsze ({olderList.length})</div>
          {olderList.map((m: any, i: number) => <EmailRow key={i} m={m} />)}
        </div>
      )}
    </div>
  );
}
