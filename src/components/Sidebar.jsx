import { capitalize } from "../utils/api";

export default function Sidebar() {
  return (
    <aside className="bg-ink p-6 text-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-64">
      <div className="mb-8 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-amber font-black text-ink">X</span>
        <div>
          <strong className="block">Xeno Copilot</strong>
          <span className="text-sm text-white/70">AI campaign cockpit</span>
        </div>
      </div>
      <nav className="grid gap-2">
        {["copilot", "segments", "campaigns", "customers"].map((item) => (
          <a className="rounded-lg px-3 py-2 text-white/80 transition hover:bg-white/10 hover:text-white" href={`#${item}`} key={item}>
            {capitalize(item)}
          </a>
        ))}
      </nav>
    </aside>
  );
}
