// AI 角色扮演场景配置（通用情侣场景，不绑定真实人名）

export type RoleplayScenario = {
  id: string;
  emoji: string;
  title: string;
  titleZh: string;
  description: string;
  opening: string;
  aiRole: string;
};

export const ROLEPLAY_SCENARIOS: RoleplayScenario[] = [
  {
    id: "family",
    emoji: "👨‍👩‍👧",
    title: "Meeting the family",
    titleZh: "见家长",
    description: "Practice greeting a parent and answering simple questions.",
    opening:
      "你好呀！第一次见面很高兴。(Nǐ hǎo ya! Dì yī cì jiànmiàn hěn gāoxìng.) — Hello! Nice to meet you.",
    aiRole:
      "你扮演学习者伴侣的家长，第一次见面。你热情友好，会问简单问题（叫什么名字、哪里人、喜欢吃什么、会说中文吗等），也会鼓励对方。",
  },
  {
    id: "video_call",
    emoji: "📱",
    title: "Daily video call",
    titleZh: "日常视频通话",
    description: "A sweet daily video call — talk about your day in Chinese.",
    opening:
      "嗨！今天过得怎么样？(Hāi! Jīntiān guò de zěnmeyàng?) — Hi! How was your day?",
    aiRole:
      "你扮演学习者的伴侣，进行日常视频通话。聊今天的生活、吃了什么、想不想对方，语气自然温暖。",
  },
  {
    id: "restaurant",
    emoji: "🍜",
    title: "Ordering food",
    titleZh: "在餐厅点菜",
    description: "Order dishes at a Chinese restaurant.",
    opening:
      "欢迎光临！请问几位？(Huānyíng guānglín! Qǐngwèn jǐ wèi?) — Welcome! How many people?",
    aiRole:
      "你扮演中国餐厅的服务员，为客人点菜。介绍简单的菜（饺子、面条、米饭、鸡肉等），问要喝什么，最后确认订单。",
  },
];

export function getScenario(id: string) {
  return ROLEPLAY_SCENARIOS.find((s) => s.id === id) ?? null;
}

export function buildRoleplaySystemPrompt(scenario: RoleplayScenario) {
  return [
    "你在一个中文学习应用里做角色扮演，对话对象是汉语学习者（约 HSK1-2，可能使用英语）。",
    scenario.aiRole,
    "用简体中文为主，必要时加简短英文或拼音帮助理解。回复简短自然。",
  ].join("\n");
}

export function buildRoleplayFeedbackPrompt(scenario: RoleplayScenario) {
  return [
    `你是中文老师。以下是学习者在「${scenario.titleZh}」场景中的角色扮演对话记录。`,
    "用简短英文给出 2-3 条鼓励性反馈和 1 个可改进点。",
  ].join("\n");
}
