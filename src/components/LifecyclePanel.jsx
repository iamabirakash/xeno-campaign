import { SectionTitle } from "./shared";

const lifecycleSteps = ["Queued", "Sent", "Delivered", "Opened", "Read", "Clicked", "Converted"];

export default function LifecyclePanel({ campaign }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
      <SectionTitle eyebrow="Live callback model" title="Communication lifecycle" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-2">
        {lifecycleSteps.map((step) => (
          <span className="grid min-h-11 place-items-center rounded-lg bg-meadow px-3 text-center text-xs font-black uppercase tracking-wide text-moss" key={step}>
            {step}
          </span>
        ))}
      </div>
      <p className="mt-4 text-sm leading-6 text-muted">
        The CRM sends campaign messages to a separate channel simulator. The simulator asynchronously calls the CRM receipt API with delivery and engagement events.
      </p>
      {campaign && (
        <div className="mt-4 rounded-lg border border-line bg-soft p-4">
          <p className="text-xs font-black uppercase tracking-wider text-moss">Latest campaign</p>
          <h3 className="mt-1 font-black">{campaign.name}</h3>
          <p className="mt-1 text-sm text-muted">
            {campaign.stats.delivered} delivered, {campaign.stats.clicked} clicked, {campaign.stats.converted} converted
          </p>
        </div>
      )}
    </section>
  );
}
