import { useEffect, useMemo, useState } from "react";
import { api } from "./utils/api";
import { ErrorBanner } from "./components/shared";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Metrics from "./components/Metrics";
import CopilotPanel from "./components/CopilotPanel";
import LifecyclePanel from "./components/LifecyclePanel";
import Segments from "./components/Segments";
import Campaigns from "./components/Campaigns";
import Customers from "./components/Customers";

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
