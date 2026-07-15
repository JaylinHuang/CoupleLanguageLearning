export type LessonContent = {
  intro: string;
  sentences: Array<{
    chinese: string;
    pinyin: string;
    pinyinNumber: string;
    english: string;
  }>;
  typingPrompts: Array<{
    answer: string;
    pinyinNumber: string;
    hint: string;
  }>;
  quiz: Array<{
    type: "listen_choice" | "fill_blank";
    prompt: string;
    audioText?: string;
    options?: string[];
    answer: string;
  }>;
};

// 单道测验题的答题明细（用于课程答题记录）
export type QuizAnswerDetail = {
  prompt: string;
  audioText?: string;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
};

export type PersonPhrases = Array<{
  chinese: string;
  pinyin: string;
  english: string;
}>;

export function parseLessonContent(raw: string): LessonContent {
  return JSON.parse(raw) as LessonContent;
}

export function parsePersonPhrases(raw: string): PersonPhrases {
  return JSON.parse(raw) as PersonPhrases;
}
