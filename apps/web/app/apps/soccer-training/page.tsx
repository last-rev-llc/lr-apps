import { DRILLS } from "./data/drills";
import { DrillLibrary } from "./components/drill-library";

export default function SoccerTrainingPage() {
  const totalMinutes = DRILLS.reduce((sum, d) => sum + d.duration, 0);

  return (
    <div>
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">⚽</span>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Soccer Training Drills
          </h1>
        </div>
        <p className="text-muted-foreground text-sm mb-5">
          Video-guided drills for speed, dribbling, finishing, strength, and
          recovery
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-green">
              {DRILLS.length}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Drills</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-green">
              {Math.round(totalMinutes / 60)}h+
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Content</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-green">7</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Categories
            </div>
          </div>
        </div>
      </div>

      {/* Library */}
      <DrillLibrary drills={DRILLS} />
    </div>
  );
}
