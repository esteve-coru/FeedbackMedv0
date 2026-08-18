import { db } from "@/lib/db";
import { surveyResponses } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

// Force dynamic rendering: this page hits the database on every request.
// Without this, Next.js may try to query the DB at build time (before
// env vars / network access exist in the build environment) and fail.
export const dynamic = "force-dynamic";

function computeStats(rows: { npsScore: number; ward: string }[]) {
  const total = rows.length;
  if (total === 0) {
    return { total: 0, avgScore: 0, topBoxPct: 0, bottomBoxPct: 0, byWard: [] as { ward: string; count: number; avg: number }[] };
  }

  const avgScore = rows.reduce((sum, r) => sum + r.npsScore, 0) / total;

  // Top-box / bottom-box instead of a plain mean, since raw means over-flatten
  // the ceiling effect typical in patient satisfaction data.
  const topBox = rows.filter((r) => r.npsScore >= 9).length; // promoters-ish
  const bottomBox = rows.filter((r) => r.npsScore <= 6).length; // detractors-ish

  const wardMap = new Map<string, number[]>();
  for (const r of rows) {
    const list = wardMap.get(r.ward) ?? [];
    list.push(r.npsScore);
    wardMap.set(r.ward, list);
  }
  const byWard = Array.from(wardMap.entries()).map(([ward, scores]) => ({
    ward,
    count: scores.length,
    avg: scores.reduce((a, b) => a + b, 0) / scores.length,
  }));

  return {
    total,
    avgScore,
    topBoxPct: (topBox / total) * 100,
    bottomBoxPct: (bottomBox / total) * 100,
    byWard,
  };
}

export default async function HomePage() {
  const rows = await db.select().from(surveyResponses).orderBy(desc(surveyResponses.createdAt));
  const stats = computeStats(rows);

  return (
    <main>
      <h1>FeedbackMed — MVP Pipeline Demo</h1>
      <p style={{ color: "#666", maxWidth: 640 }}>
        This is a deliberately unstyled proof of the pipeline: CSV import → Supabase (Postgres) →
        server-side calculation → this page. No auth, no real survey flow, no design — just
        confirming every connection works end to end.
      </p>

      <h2>Processed stats</h2>
      {stats.total === 0 ? (
        <p>
          No data yet. Run <code>npm run import:csv</code> against your Supabase database, then
          reload this page.
        </p>
      ) : (
        <>
          <ul>
            <li>Total responses: {stats.total}</li>
            <li>Average NPS score: {stats.avgScore.toFixed(2)} / 10</li>
            <li>Top-box (score 9–10): {stats.topBoxPct.toFixed(1)}%</li>
            <li>Bottom-box (score 0–6): {stats.bottomBoxPct.toFixed(1)}%</li>
          </ul>

          <h3>By ward</h3>
          <table border={1} cellPadding={6} style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Ward</th>
                <th>Responses</th>
                <th>Avg score</th>
              </tr>
            </thead>
            <tbody>
              {stats.byWard.map((w) => (
                <tr key={w.ward}>
                  <td>{w.ward}</td>
                  <td>{w.count}</td>
                  <td>{w.avg.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2>Raw rows ({rows.length})</h2>
      <table border={1} cellPadding={6} style={{ borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Admission</th>
            <th>Discharge</th>
            <th>Ward</th>
            <th>Age</th>
            <th>Contact pref.</th>
            <th>NPS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.patientName}</td>
              <td>{r.admissionDate}</td>
              <td>{r.dischargeDate}</td>
              <td>{r.ward}</td>
              <td>{r.age}</td>
              <td>{r.contactPreference}</td>
              <td>{r.npsScore}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
