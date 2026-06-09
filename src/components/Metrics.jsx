import { currency } from "../utils/api";

export default function Metrics({ summary }) {
  const metrics = [
    ["Customers", summary?.customers ?? 0],
    ["Orders ingested", summary?.orders ?? 0],
    ["Campaigns", summary?.campaigns ?? 0],
    ["Attributed revenue", currency.format(summary?.revenue ?? 0)]
  ];

  return (
    <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(([label, value]) => (
        <article className="rounded-lg border border-line bg-white p-5 shadow-panel" key={label}>
          <strong className="block text-3xl font-black text-ink">{value}</strong>
          <span className="text-sm text-muted">{label}</span>
        </article>
      ))}
    </section>
  );
}
