import type { VocabLevelStat } from "@/lib/vocab-stats";

// 词汇量可视化：按 HSK 等级显示掌握/学习中进度条（Profile 与 Admin 共用）
export function VocabProgress({ stats }: { stats: VocabLevelStat[] }) {
  const totalMastered = stats.reduce((s, l) => s + l.mastered, 0);
  const totalLearning = stats.reduce((s, l) => s + l.learning, 0);

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-medium text-warm-brown">Vocabulary</h2>
        <p className="text-xs text-warm-gray">
          <span className="font-semibold text-green-700">{totalMastered}</span>{" "}
          mastered ·{" "}
          <span className="font-semibold text-coral-dark">{totalLearning}</span>{" "}
          learning
        </p>
      </div>
      <div className="space-y-3">
        {stats.map((level) => {
          const masteredPct =
            level.total > 0 ? (level.mastered / level.total) * 100 : 0;
          const learningPct =
            level.total > 0 ? (level.learning / level.total) * 100 : 0;
          return (
            <div key={level.hskLevel}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-warm-brown">
                  HSK {level.hskLevel}
                </span>
                <span className="text-warm-gray">
                  {level.mastered + level.learning}/{level.total}
                </span>
              </div>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-blush/50">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${masteredPct}%` }}
                  title={`Mastered: ${level.mastered}`}
                />
                <div
                  className="h-full bg-coral"
                  style={{ width: `${learningPct}%` }}
                  title={`Learning: ${level.learning}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-warm-gray">
        <span className="mr-3 inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          Mastered (21+ day interval)
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-coral" />
          Learning
        </span>
      </p>
    </div>
  );
}
