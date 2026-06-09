import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const lifecycleSteps = ["Queued", "Sent", "Delivered", "Opened", "Read", "Clicked", "Converted"];

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export default function App() {
  const [summary, setSummary] = useState(null);
  const [segments, setSegments] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [goal, setGoal] = useState("Win back inactive shoppers with a personal offer before the weekend.");
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      const [nextSummary, nextSegments, nextCampaigns, nextCustomers] = await Promise.all([
        api("/api/summary"),
        api("/api/segments"),
        api("/api/campaigns"),
        api("/api/customers")
      ]);

      setSummary(nextSummary);
      setSegments(nextSegments);
      setCampaigns(nextCampaigns);
      setCustomers(nextCustomers);
      setError("");
    } catch (requestError) {
      setError(`Could not load CRM data. ${requestError.message}`);
    }
  }

  async function generateRecommendation() {
    setLoading(true);
    setNotice("");
    setError("");
    try {
      const nextRecommendation = await api("/api/ai/recommend", {
        method: "POST",
        body: JSON.stringify({ goal })
      });
      setRecommendation(nextRecommendation);
    } catch (requestError) {
      setError(`Could not generate a campaign plan. ${requestError.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function launchCampaign() {
    if (!recommendation) return;

    setLoading(true);
    setNotice("");
    setError("");
    try {
      await api("/api/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name: recommendation.segmentDraft.name,
          goal: recommendation.goal,
          segment: recommendation.segmentDraft,
          channel: recommendation.recommendedChannel,
          messageTemplate: recommendation.messageTemplate
        })
      });
      setNotice("Campaign launched. Simulated channel receipts are arriving now.");
      await loadDashboard();
    } catch (requestError) {
      setError(`Could not launch the campaign. ${requestError.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    generateRecommendation();
    loadDashboard();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(loadDashboard, 2500);
    return () => window.clearInterval(timer);
  }, []);

  const topCampaign = useMemo(() => campaigns[0], [campaigns]);

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />
      <main className="w-full px-4 py-5 sm:px-6 lg:ml-64 lg:px-8">
        <Header onRefresh={loadDashboard} />
        {error && <ErrorBanner message={error} />}
        <Metrics summary={summary} />

        <section id="copilot" className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <CopilotPanel
            goal={goal}
            loading={loading}
            notice={notice}
            recommendation={recommendation}
            onGoalChange={setGoal}
            onGenerate={generateRecommendation}
            onLaunch={launchCampaign}
          />
          <LifecyclePanel campaign={topCampaign} />
        </section>

        <Segments segments={segments} />
        <Campaigns campaigns={campaigns} />
        <Customers customers={customers} />
      </main>
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
      {message}
    </div>
  );
}

function Sidebar() {
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

function Header({ onRefresh }) {
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

function Metrics({ summary }) {
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

function CopilotPanel({ goal, loading, notice, recommendation, onGoalChange, onGenerate, onLaunch }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
      <SectionTitle eyebrow="AI-native workflow" title="Campaign copilot">
        <button className="rounded-lg bg-moss px-4 py-3 font-bold text-white transition hover:brightness-95" disabled={loading} onClick={onGenerate}>
          {loading ? "Thinking..." : "Generate plan"}
        </button>
      </SectionTitle>

      <textarea
        className="min-h-28 w-full resize-y rounded-lg border border-line p-4 text-ink outline-none ring-moss/20 transition focus:ring-4"
        value={goal}
        onChange={(event) => onGoalChange(event.target.value)}
      />

      {notice && <p className="mt-3 rounded-lg bg-meadow px-4 py-3 text-sm font-bold text-moss">{notice}</p>}

      {recommendation && (
        <div className="mt-4 grid gap-3">
          <RecommendationCard title={recommendation.segmentDraft.name} text={recommendation.segmentDraft.description}>
            <Tag>{recommendation.audienceSize} shoppers</Tag>
            <Tag>{recommendation.recommendedChannel.toUpperCase()}</Tag>
            {Object.entries(recommendation.segmentDraft.rule).map(([key, value]) => (
              <Tag key={key}>
                {labelize(key)}: {value}
              </Tag>
            ))}
          </RecommendationCard>

          <RecommendationCard title={recommendation.subject} text={recommendation.messageTemplate}>
            {recommendation.reasoning.map((reason) => (
              <Tag key={reason}>{reason}</Tag>
            ))}
          </RecommendationCard>

          <div className="flex flex-wrap gap-3">
            <button className="rounded-lg bg-moss px-4 py-3 font-bold text-white transition hover:brightness-95" disabled={loading} onClick={onLaunch}>
              Launch campaign
            </button>
            <button className="rounded-lg bg-meadow px-4 py-3 font-bold text-moss transition hover:brightness-95" disabled={loading} onClick={onGenerate}>
              Try another plan
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function LifecyclePanel({ campaign }) {
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

function Segments({ segments }) {
  return (
    <section id="segments" className="mt-5 rounded-lg border border-line bg-white p-5 shadow-panel">
      <SectionTitle eyebrow="Audience intelligence" title="Segments" />
      <div className="grid gap-4 lg:grid-cols-2">
        {segments.map((segment) => (
          <article className="rounded-lg border border-line bg-white p-4" key={segment.id}>
            <h3 className="text-lg font-black">{segment.name}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{segment.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Tag>{segment.size} shoppers</Tag>
              <Tag>{segment.createdBy}</Tag>
              {Object.entries(segment.rule).map(([key, value]) => (
                <Tag key={key}>
                  {labelize(key)}: {value}
                </Tag>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Campaigns({ campaigns }) {
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

function Customers({ customers }) {
  return (
    <section id="customers" className="mt-5 rounded-lg border border-line bg-white p-5 shadow-panel">
      <SectionTitle eyebrow="Ingested shoppers" title="Customers" />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Lifecycle</th>
              <th className="px-3 py-3">Spend</th>
              <th className="px-3 py-3">Orders</th>
              <th className="px-3 py-3">Last order</th>
              <th className="px-3 py-3">Channel</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr className="border-b border-line last:border-0" key={customer.id}>
                <td className="whitespace-nowrap px-3 py-3">
                  <strong>{customer.name}</strong>
                  <span className="block text-sm text-muted">
                    {customer.city} · {customer.favoriteCategory}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3">{customer.lifecycle}</td>
                <td className="whitespace-nowrap px-3 py-3">{currency.format(customer.totalSpend)}</td>
                <td className="whitespace-nowrap px-3 py-3">{customer.orderCount}</td>
                <td className="whitespace-nowrap px-3 py-3">{customer.daysSinceLastOrder} days ago</td>
                <td className="whitespace-nowrap px-3 py-3">{customer.preferredChannel.toUpperCase()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SectionTitle({ eyebrow, title, children }) {
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

function RecommendationCard({ title, text, children }) {
  return (
    <article className="rounded-lg border border-line bg-soft p-4">
      <h3 className="font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </article>
  );
}

function Stat({ label, value }) {
  return (
    <div className="border-l-4 border-moss pl-3">
      <strong className="block text-lg">{value}</strong>
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}

function Tag({ children }) {
  return <span className="rounded-full bg-soft px-3 py-1 text-xs font-bold text-muted">{children}</span>;
}

function percent(value, total, withSymbol = true) {
  if (!total) return withSymbol ? "0%" : 0;
  const result = Math.round((value / total) * 100);
  return withSymbol ? `${result}%` : result;
}

function labelize(value) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
