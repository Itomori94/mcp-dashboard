import "@/index.css";
import { useToolInfo } from "../helpers.js";

export default function Documents() {
  const { output } = useToolInfo<"show_documents">();

  if (!output) return <div className="dash"><p className="text-muted">Ładowanie...</p></div>;

  const { status, docs, query } = output;
  const paperlessStatus: any = status || {};
  const docList: any[] = Array.isArray(docs)
    ? docs
    : Array.isArray((docs as any)?.results)
    ? (docs as any).results
    : [];

  const isOk = !(paperlessStatus as any)?.error;

  return (
    <div className="dash" data-llm={`Paperless: ${isOk ? "online" : "offline"}, ${docList.length} dokumentów`}>
      <h1 className="dash-title">📄 Dokumenty Paperless-ngx</h1>

      <div className="card">
        <div className="card-title">📡 Status</div>
        <span className={`badge ${isOk ? "badge-green" : "badge-red"}`}>
          {isOk ? "● Online" : "● Offline"}
        </span>
        {paperlessStatus.document_count != null && (
          <span className="text-muted text-sm" style={{ marginLeft: 12 }}>
            {paperlessStatus.document_count} dokumentów w bazie
          </span>
        )}
      </div>

      <div className="card section-gap">
        <div className="card-title">
          {query ? `🔍 Wyniki: "${query}"` : "🕐 Ostatnio dodane"} ({docList.length})
        </div>
        {docList.length === 0 ? (
          <p className="text-muted text-sm">Brak dokumentów</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Tytuł</th><th>Nadawca</th><th>Tagi</th><th>Data</th></tr>
            </thead>
            <tbody>
              {docList.map((d: any, i: number) => {
                const tags: string[] = Array.isArray(d.tags) ? d.tags : [];
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>
                      <span className="truncate" style={{ display: "block", maxWidth: 220 }}>
                        {d.title ?? d.original_file_name ?? `Dokument #${d.id}`}
                      </span>
                    </td>
                    <td className="text-muted text-sm">{d.correspondent ?? "–"}</td>
                    <td>
                      {tags.slice(0, 3).map((tag: string, j: number) => (
                        <span key={j} className="badge badge-blue" style={{ marginRight: 2, fontSize: 10 }}>{tag}</span>
                      ))}
                    </td>
                    <td className="text-muted text-xs" style={{ whiteSpace: "nowrap" }}>
                      {d.created ? new Date(d.created).toLocaleDateString("pl-PL") : d.added ? new Date(d.added).toLocaleDateString("pl-PL") : "–"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
