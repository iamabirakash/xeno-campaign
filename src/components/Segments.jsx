import { labelize } from "../utils/api";
import { SectionTitle, Tag } from "./shared";

export default function Segments({ segments }) {
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
