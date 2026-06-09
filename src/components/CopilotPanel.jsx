import { labelize } from "../utils/api";
import { SectionTitle, Tag } from "./shared";

function RecommendationCard({ title, text, children }) {
  return (
    <article className="rounded-lg border border-line bg-soft p-4">
      <h3 className="font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </article>
  );
}

export default function CopilotPanel({ goal, loading, notice, recommendation, onGoalChange, onGenerate, onLaunch }) {
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
