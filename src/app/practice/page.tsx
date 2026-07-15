import { requireLearner } from "@/app/actions/auth";
import { SiteHeader, PageShell } from "@/components/layout";

// 练习中心：汇总所有练习模式的入口
const MODES = [
  {
    href: "/practice/ai",
    emoji: "💬",
    title: "Chat with Lin",
    description: "Free chat with AI Lin — ask anything",
  },
  {
    href: "/practice/roleplay",
    emoji: "🎭",
    title: "Roleplay",
    description: "Real-life scenarios: family, video call, restaurant",
  },
  {
    href: "/practice/writing",
    emoji: "📝",
    title: "Writing Check",
    description: "Write Chinese, AI teacher corrects you",
  },
  {
    href: "/practice/smart-quiz",
    emoji: "🧠",
    title: "Smart Quiz",
    description: "AI questions from your mistakes & hard words",
  },
  {
    href: "/mistakes",
    emoji: "📕",
    title: "My Mistakes",
    description: "See wrong answers and correct ones",
  },
  {
    href: "/dictation",
    emoji: "🎧",
    title: "Dictation",
    description: "Listen and type hanzi or pinyin",
  },
  {
    href: "/handwriting",
    emoji: "✍️",
    title: "Handwriting",
    description: "Learn stroke order, trace characters",
  },
  {
    href: "/listening",
    emoji: "🔊",
    title: "Listening",
    description: "Listen and choose the meaning",
  },
  {
    href: "/speaking",
    emoji: "🎤",
    title: "Speaking",
    description: "Follow along and record yourself",
  },
  {
    href: "/typing",
    emoji: "⌨️",
    title: "Typing",
    description: "Type pinyin with number tones",
  },
];

export default async function PracticeHubPage() {
  const user = await requireLearner();

  return (
    <>
      <SiteHeader user={user} />
      <PageShell title="Practice" subtitle="Pick a practice mode · Pumili ng pagsasanay">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODES.map((m) => (
            <a
              key={m.href}
              href={m.href}
              className="card p-5 transition hover:border-coral hover:shadow-md"
            >
              <p className="text-3xl">{m.emoji}</p>
              <p className="mt-2 font-medium text-warm-brown">{m.title}</p>
              <p className="mt-1 text-xs text-warm-gray">{m.description}</p>
            </a>
          ))}
        </div>
      </PageShell>
    </>
  );
}
