export default function Header({ onRefresh }) {
  return (
    <section className="mb-5 flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-moss">Retail engagement workspace</p>
        <h1 className="mt-2 max-w-5xl text-4xl font-black leading-none tracking-normal text-ink sm:text-5xl lg:text-6xl">
          Decide who to talk to, what to say, and watch the channel loop close.
        </h1>
      </div>
      <button
        className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-moss text-xl font-bold text-white shadow-panel transition hover:brightness-95"
        onClick={onRefresh}
        title="Refresh dashboard"
      >
        ↻
      </button>
    </section>
  );
}
