import { percent } from "../utils/api";
import { SectionTitle, Tag, Stat } from "./shared";

function CampaignCard({ campaign }) {
  const completion = percent(campaign.stats.failed + campaign.stats.delivered, campaign.stats.total, false);

  return (
    <article className="rounded-lg border border-line bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black">{campaign.name}</h3>
          <p className="mt-1 text-sm text-muted">{campaign.goal}</p>
        </div>
        <Tag>{campaign.status}</Tag>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Tag>{campaign.channel.toUpperCase()}</Tag>
        <Tag>{campaign.stats.total} recipients</Tag>
        <Tag>{campaign.segment.name}</Tag>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-soft">
        <span className="block h-full rounded-full bg-gradient-to-r from-moss to-signal" style={{ width: `${completion}%` }} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="Sent" value={campaign.stats.sent} />
        <Stat label="Delivered" value={`${campaign.stats.delivered} (${percent(campaign.stats.delivered, campaign.stats.total)})`} />
        <Stat label="Opened" value={campaign.stats.opened} />
        <Stat label="Clicked" value={`${campaign.stats.clicked} (${percent(campaign.stats.clicked, campaign.stats.total)})`} />
        <Stat label="Converted" value={`${campaign.stats.converted} (${percent(campaign.stats.converted, campaign.stats.total)})`} />
        <Stat label="Failed" value={campaign.stats.failed} />
      </div>
    </article>
  );
}

export default function Campaigns({ campaigns }) {
  return (
    <section id="campaigns" className="mt-5 rounded-lg border border-line bg-white p-5 shadow-panel">
      <SectionTitle eyebrow="Performance insights" title="Campaigns" />
      <div className="grid gap-4">
        {!campaigns.length && <p className="text-muted">No campaigns yet. Generate a copilot plan and launch one.</p>}
        {campaigns.map((campaign) => (
          <CampaignCard campaign={campaign} key={campaign.id} />
        ))}
      </div>
    </section>
  );
}
