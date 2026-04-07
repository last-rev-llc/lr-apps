import questionsData from "./data/questions.json";
import { TutorApp } from "./components/tutor-app";
import type { TutorQuestion } from "./lib/types";

export default function HsptTutorPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl text-emerald-400 mb-1">
          HSPT Tutor
        </h2>
        <p className="text-muted-foreground text-sm">
          Adaptive prep for all five HSPT sections — practice your weak spots
          first
        </p>
      </div>
      <TutorApp questions={questionsData as unknown as TutorQuestion[]} />
    </div>
  );
}
