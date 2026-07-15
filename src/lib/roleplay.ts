// AI 角色扮演场景配置（页面、API 共用）

export type RoleplayScenario = {
  id: string;
  emoji: string;
  title: string;
  titleZh: string;
  description: string;
  opening: string; // AI 的开场白
  aiRole: string; // 场景角色设定（拼进 system prompt）
};

export const ROLEPLAY_SCENARIOS: RoleplayScenario[] = [
  {
    id: "family",
    emoji: "👨‍👩‍👧",
    title: "Meeting Lin's family",
    titleZh: "见林的家人",
    description: "Practice greeting Lin's mom and answering her questions.",
    opening: "你好呀！你就是 Erika 吧？(Nǐ hǎo ya! Nǐ jiù shì Erika ba?) — Hello! You must be Erika?",
    aiRole:
      "你扮演 Lin 的妈妈，第一次见到儿子的女朋友 Erika。你热情友好，会问她一些简单的问题（叫什么名字、哪里人、喜欢吃什么、会说中文吗等），也会夸她。",
  },
  {
    id: "video_call",
    emoji: "📱",
    title: "Video call with Lin",
    titleZh: "和林视频通话",
    description: "A sweet daily video call — talk about your day in Chinese.",
    opening: "老婆！今天过得怎么样？(Lǎopó! Jīntiān guò de zěnmeyàng?) — Baby! How was your day?",
    aiRole:
      "你扮演 Lin 本人，在上海工作，和远在菲律宾的女朋友 Erika 视频通话。聊今天的生活、吃了什么、想不想对方，语气甜蜜自然。",
  },
  {
    id: "restaurant",
    emoji: "🍜",
    title: "Ordering food",
    titleZh: "在餐厅点菜",
    description: "Order dishes at a Chinese restaurant.",
    opening: "欢迎光临！请问几位？(Huānyíng guānglín! Qǐngwèn jǐ wèi?) — Welcome! How many people?",
    aiRole:
      "你扮演中国餐厅的服务员，为客人 Erika 点菜。介绍简单的菜（饺子、面条、米饭、鸡肉等），问她要喝什么，最后确认订单。",
  },
];

export function getScenario(id: string): RoleplayScenario | undefined {
  return ROLEPLAY_SCENARIOS.find((s) => s.id === id);
}

// 对话时的 system prompt
export function buildRoleplaySystemPrompt(scenario: RoleplayScenario): string {
  return [
    "你在一个中文学习应用里做角色扮演，对话对象是 Erika（菲律宾人，中文水平 HSK1-2，母语是英语/塔加洛语）。",
    scenario.aiRole,
    "",
    "规则：",
    "- 每次回复只说 1-2 句简单中文（尽量用 HSK1-2 词汇）",
    "- 每句中文后面用括号标注拼音和英文翻译，例如：你好！(Nǐ hǎo! — Hello!)",
    "- 她说错了不要打断纠错，自然地继续对话",
    "- 始终保持角色，友好耐心，多提问让她开口",
  ].join("\n");
}

// 结束对话后的评价 prompt
export function buildRoleplayFeedbackPrompt(scenario: RoleplayScenario): string {
  return [
    `你是中文老师。以下是学习者 Erika（HSK1-2）在「${scenario.titleZh}」场景中的角色扮演对话记录。`,
    "请用英文给她反馈，包括：",
    "1. 表扬她做得好的地方（具体到某句话）",
    "2. 最多指出 2 个中文错误，给出正确说法和拼音",
    "3. 一句温暖的鼓励",
    '最后单独一行给出评分，格式："Stars: N/5"（N 为 1-5）。',
  ].join("\n");
}
