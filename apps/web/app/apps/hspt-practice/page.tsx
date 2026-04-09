import questionsData from "./data/questions.json";
import { PracticeApp } from "./components/practice-app";
import type { HSPTData } from "./lib/types";

export default function HsptPracticePage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl text-pill-0 mb-1">
          HSPT Practice
        </h2>
        <p className="text-muted-foreground text-sm">
          Timed practice exams for all five HSPT sections
        </p>
      </div>
      <PracticeApp data={questionsData as unknown as HSPTData} />
    </div>
  );
}
