import winsData from "./data/wins.json";
import { WinsGallery } from "./components/wins-gallery";

export default function AlphaWinsPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-6 py-8 border-b border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚡</span>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Alpha Wins</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Recent wins &amp; accomplishments
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery with search/filter/modal */}
      <WinsGallery wins={winsData} />
    </div>
  );
}
