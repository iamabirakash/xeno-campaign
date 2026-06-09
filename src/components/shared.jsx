export function ErrorBanner({ message }) {
  return (
    <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
      {message}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, children }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-moss">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-black">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function Tag({ children }) {
  return <span className="rounded-full bg-soft px-3 py-1 text-xs font-bold text-muted">{children}</span>;
}

export function Stat({ label, value }) {
  return (
    <div className="border-l-4 border-moss pl-3">
      <strong className="block text-lg">{value}</strong>
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}
