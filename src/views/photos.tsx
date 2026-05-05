import "@/index.css";
import { useToolInfo } from "../helpers.js";

export default function Photos() {
  const { output } = useToolInfo<"show_photos">();

  if (!output) return <div className="dash"><p className="text-muted">Ładowanie...</p></div>;

  const { albums, recent, query } = output;
  const albumList: any[] = Array.isArray(albums) ? albums : [];
  const recentList: any[] = Array.isArray(recent)
    ? recent
    : Array.isArray((recent as any)?.assets)
    ? (recent as any).assets
    : [];

  return (
    <div className="dash" data-llm={`Immich: ${albumList.length} albumów, ${recentList.length} ostatnich zdjęć`}>
      <h1 className="dash-title">📸 Zdjęcia Immich</h1>

      {/* Albums */}
      {albumList.length > 0 && (
        <div className="card">
          <div className="card-title">🗂️ Albumy ({albumList.length})</div>
          <div className="grid-2">
            {albumList.slice(0, 10).map((a: any, i: number) => (
              <div key={i} className="row">
                <span style={{ fontSize: 20 }}>🖼️</span>
                <div style={{ minWidth: 0 }}>
                  <div className="truncate text-sm" style={{ fontWeight: 600 }}>{a.albumName ?? a.name}</div>
                  <div className="text-xs text-muted">{a.assetCount ?? a.asset_count ?? 0} zdjęć</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent photos */}
      {recentList.length > 0 && (
        <div className="card section-gap">
          <div className="card-title">
            {query ? `🔍 Wyniki: "${query}"` : "🕐 Ostatnie zdjęcia"} ({recentList.length})
          </div>
          <div className="photo-grid">
            {recentList.slice(0, 20).map((asset: any, i: number) => {
              const date = asset.fileCreatedAt ?? asset.created_at ?? asset.exifInfo?.dateTimeOriginal;
              return (
                <div key={i} className="photo-thumb" title={asset.originalFileName ?? asset.filename ?? ""}>
                  <div style={{ textAlign: "center", padding: 8 }}>
                    <div style={{ fontSize: 24 }}>{asset.type === "VIDEO" ? "🎬" : "🖼️"}</div>
                    <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                      {date ? new Date(date).toLocaleDateString("pl-PL", { month: "short", day: "numeric" }) : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 8 }}>
            {recentList.slice(0, 5).map((asset: any, i: number) => (
              <div key={i} className="row text-xs">
                <span>{asset.type === "VIDEO" ? "🎬" : "🖼️"}</span>
                <span className="truncate">{asset.originalFileName ?? asset.filename ?? asset.id}</span>
                <span className="text-muted" style={{ marginLeft: "auto", whiteSpace: "nowrap" }}>
                  {asset.exifInfo?.city ?? asset.city ?? ""}
                  {asset.fileCreatedAt ? " · " + new Date(asset.fileCreatedAt).toLocaleDateString("pl-PL") : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
