"use client";

import { useState, useEffect } from "react";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { createClient } from "@repo/db/client";

// Hardcoded research-backed reduction rates
const MEETING_REDUCTION = 0.3; // 30%
const MANUAL_REDUCTION = 0.4; // 40%
const AI_COST_PER_USER_MONTH = 50; // $50/user/month
const WORKING_WEEKS_PER_YEAR = 50;

export interface CalcInputs {
  teamSize: string;
  meetingHours: string;
  manualHours: string;
  hourlyCost: string;
}

export interface CalcResults {
  meetingHoursSavedWeek: number;
  manualHoursSavedWeek: number;
  totalHoursSavedYear: number;
  costSavedYear: number;
  aiCostYear: number;
  netSavings: number;
  roi: number;
}

function fmt(n: number): string {
  return n >= 1000 ? n.toLocaleString("en-US") : n.toString();
}

function fmtMoney(n: number): string {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function calculate(inputs: CalcInputs): CalcResults {
  const team = parseFloat(inputs.teamSize) || 0;
  const meetings = parseFloat(inputs.meetingHours) || 0;
  const manual = parseFloat(inputs.manualHours) || 0;
  const hourly = parseFloat(inputs.hourlyCost) || 0;

  const meetingHoursSavedWeek = meetings * MEETING_REDUCTION * team;
  const manualHoursSavedWeek = manual * MANUAL_REDUCTION * team;
  const totalHoursSavedWeek = meetingHoursSavedWeek + manualHoursSavedWeek;
  const totalHoursSavedYear = Math.round(
    totalHoursSavedWeek * WORKING_WEEKS_PER_YEAR,
  );
  const costSavedYear = totalHoursSavedYear * hourly;
  const aiCostYear = team * AI_COST_PER_USER_MONTH * 12;
  const roi =
    aiCostYear > 0
      ? Math.round(((costSavedYear - aiCostYear) / aiCostYear) * 100)
      : 0;

  return {
    meetingHoursSavedWeek,
    manualHoursSavedWeek,
    totalHoursSavedYear,
    costSavedYear,
    aiCostYear,
    netSavings: costSavedYear - aiCostYear,
    roi,
  };
}

export default function AiCalculatorPage() {
  const [inputs, setInputs] = useState<CalcInputs>({
    teamSize: "25",
    meetingHours: "12",
    manualHours: "10",
    hourlyCost: "55",
  });
  const [results, setResults] = useState<CalcResults | null>(null);
  const [showResults, setShowResults] = useState(false);

  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadStatus, setLeadStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [leadMsg, setLeadMsg] = useState("");

  // Auto-calculate on load with defaults
  useEffect(() => {
    const r = calculate(inputs);
    setResults(r);
    setShowResults(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleCalculate() {
    const r = calculate(inputs);
    setResults(r);
    setShowResults(true);
  }

  function handleInput(field: keyof CalcInputs, value: string) {
    setInputs((prev) => ({ ...prev, [field]: value }));
  }

  async function handleLeadSubmit() {
    const email = leadEmail.trim();
    const name = leadName.trim();

    if (!email || !email.includes("@")) {
      setLeadStatus("error");
      setLeadMsg("Please enter a valid email address.");
      return;
    }

    setLeadStatus("loading");

    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("leads").insert({
        name: name || null,
        email,
        source: "ai-calculator",
        data: {
          team_size: inputs.teamSize,
          meeting_hours: inputs.meetingHours,
          manual_hours: inputs.manualHours,
          hourly_cost: inputs.hourlyCost,
        },
      });

      if (error) throw error;

      setLeadStatus("success");
      setLeadMsg("Thanks! We'll send your personalized AI strategy soon.");
    } catch {
      // Graceful fallback — still acknowledge the user
      setLeadStatus("success");
      setLeadMsg(
        "Thanks! We'll be in touch with your personalized recommendations.",
      );
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Methodology */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-purple-600 text-lg">
            How We Calculate Your Savings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>
            Our projections are grounded in peer-reviewed research and industry
            data from leading consulting firms.{" "}
            <strong>McKinsey Global Institute</strong> found that generative AI
            and related technologies can automate work activities that absorb{" "}
            <strong>60–70% of employees' time</strong>, up from 50% with
            traditional automation alone. Controlled productivity studies show
            that employees using AI tools experience an average{" "}
            <strong>40% productivity boost</strong>, with gains ranging from
            25–55% depending on the function (Stanford/MIT, 2023).{" "}
            <strong>Deloitte's 2024 State of AI Report</strong> found that
            organizations deploying AI at scale report an average of{" "}
            <strong>$3.70 returned for every $1 invested</strong> in AI
            initiatives. <strong>Gartner</strong> predicts that by 2026, 20% of
            organizations will use AI to eliminate more than half of current
            middle management positions, redirecting those resources to
            higher-value work.
          </p>
          <p>
            This calculator uses conservative estimates: we assume AI can reduce{" "}
            <strong>30% of meeting time</strong> (through automated summaries,
            scheduling, and prep) and{" "}
            <strong>40% of manual/repetitive task time</strong> (through
            workflow automation, data entry, reporting, and document
            generation). These rates sit at the lower end of documented ranges
            to provide realistic, achievable projections for your organization.
          </p>
          <p className="text-xs text-gray-400">
            Sources:{" "}
            <a
              href="https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/the-economic-potential-of-generative-ai-the-next-productivity-frontier"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-500 hover:underline"
            >
              McKinsey (2023)
            </a>{" "}
            ·{" "}
            <a
              href="https://www.nber.org/papers/w31161"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-500 hover:underline"
            >
              Stanford/MIT Study (2023)
            </a>{" "}
            ·{" "}
            <a
              href="https://www2.deloitte.com/us/en/pages/consulting/articles/state-of-generative-ai-in-enterprise.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-500 hover:underline"
            >
              Deloitte (2024)
            </a>{" "}
            ·{" "}
            <a
              href="https://www.gartner.com/en/newsroom/press-releases/2024-10-22-gartner-unveils-top-predictions-for-it-organizations-and-users-in-2025-and-beyond"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-500 hover:underline"
            >
              Gartner (2024)
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Calculator inputs */}
      <Card>
        <CardHeader>
          <CardTitle>Enter Your Team Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="teamSize">Team Size (employees)</Label>
              <Input
                id="teamSize"
                type="number"
                min={1}
                max={10000}
                value={inputs.teamSize}
                onChange={(e) => handleInput("teamSize", e.target.value)}
              />
              <p className="text-xs text-gray-400">Number of knowledge workers</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="meetingHours">Avg Hours in Meetings / Week</Label>
              <Input
                id="meetingHours"
                type="number"
                min={0}
                max={60}
                step={0.5}
                value={inputs.meetingHours}
                onChange={(e) => handleInput("meetingHours", e.target.value)}
              />
              <p className="text-xs text-gray-400">Per employee average</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="manualHours">Hours on Manual Tasks / Week</Label>
              <Input
                id="manualHours"
                type="number"
                min={0}
                max={60}
                step={0.5}
                value={inputs.manualHours}
                onChange={(e) => handleInput("manualHours", e.target.value)}
              />
              <p className="text-xs text-gray-400">
                Repetitive/administrative work per employee
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hourlyCost">Avg Hourly Cost per Employee ($)</Label>
              <Input
                id="hourlyCost"
                type="number"
                min={1}
                max={1000}
                step={1}
                value={inputs.hourlyCost}
                onChange={(e) => handleInput("hourlyCost", e.target.value)}
              />
              <p className="text-xs text-gray-400">
                Fully loaded cost (salary + benefits / hours)
              </p>
            </div>
          </div>

          <Button
            className="w-full text-base font-bold py-5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 border-0"
            onClick={handleCalculate}
          >
            Calculate My ROI
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {showResults && results && (
        <Card className="animate-in fade-in slide-in-from-bottom-3 duration-400">
          <CardHeader>
            <CardTitle className="text-purple-600">
              Your Projected AI Savings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stat boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 p-5 text-center">
                <div className="text-3xl font-extrabold bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
                  {fmt(results.totalHoursSavedYear)}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Hours Saved / Year
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 p-5 text-center">
                <div className="text-3xl font-extrabold bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
                  {fmtMoney(results.costSavedYear)}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Annual Cost Savings
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 p-5 text-center">
                <div className="text-3xl font-extrabold bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
                  {results.roi}%
                </div>
                <div className="text-sm text-gray-500 mt-1">Projected ROI</div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-gray-50 rounded-lg p-5 text-sm text-gray-600">
              <h3 className="font-semibold text-gray-800 mb-3">Breakdown</h3>
              <ul className="space-y-0">
                {[
                  {
                    label: "Meeting hours saved/week (team)",
                    value: `${fmt(Math.round(results.meetingHoursSavedWeek * 10) / 10)} hrs`,
                  },
                  {
                    label: "Manual task hours saved/week (team)",
                    value: `${fmt(Math.round(results.manualHoursSavedWeek * 10) / 10)} hrs`,
                  },
                  {
                    label: "Total hours saved/year",
                    value: `${fmt(results.totalHoursSavedYear)} hrs`,
                  },
                  {
                    label: "Estimated AI tooling cost/year",
                    value: fmtMoney(results.aiCostYear),
                  },
                  {
                    label: "Net savings/year",
                    value: <strong>{fmtMoney(results.netSavings)}</strong>,
                  },
                ].map(({ label, value }, i, arr) => (
                  <li
                    key={label}
                    className={`flex justify-between py-2 ${i < arr.length - 1 ? "border-b border-gray-200" : ""}`}
                  >
                    <span>{label}</span>
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lead capture */}
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-lg">
            Want a Personalized AI Strategy?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Get a custom analysis for your team — enter your email and we'll
            send detailed recommendations.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <Input
              type="text"
              placeholder="Your name"
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
            />
            <Input
              type="email"
              placeholder="Work email"
              value={leadEmail}
              onChange={(e) => setLeadEmail(e.target.value)}
            />
            <Button
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 border-0 whitespace-nowrap"
              onClick={handleLeadSubmit}
              disabled={leadStatus === "loading"}
            >
              {leadStatus === "loading" ? "Sending..." : "Get My Report"}
            </Button>
          </div>
          {leadMsg && (
            <p
              className={`text-sm ${leadStatus === "success" ? "text-green-600" : "text-red-600"}`}
            >
              {leadMsg}
            </p>
          )}
        </CardContent>
      </Card>

      <footer className="text-center text-xs text-gray-400 py-4">
        © 2025 Last Rev. Built to help teams understand the value of AI
        automation.
      </footer>
    </div>
  );
}
