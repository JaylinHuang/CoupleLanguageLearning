export type ListeningExercise = {
  id: string;
  type: "listen_choice" | "fill_blank" | "listen_pinyin";
  chinese: string;
  pinyin: string;
  prompt: string;
  options: string[];
  answer: string;
};

export type SpeakingPhrase = {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
};

export type TypingExercise = {
  id: string;
  chinese: string;
  pinyin: string;
  pinyinNumber: string;
  english: string;
  hint: string;
};

type WordInput = {
  id: string;
  simplified: string;
  pinyin: string;
  pinyinNumber: string;
  english: string;
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildListeningExercises(words: WordInput[]): ListeningExercise[] {
  if (words.length < 4) return [];

  const exercises: ListeningExercise[] = [];

  for (const word of words.slice(0, 8)) {
    const distractors = shuffle(
      words.filter((w) => w.id !== word.id).map((w) => w.english),
    ).slice(0, 3);
    const options = shuffle([word.english, ...distractors]);

    exercises.push({
      id: `lc-${word.id}`,
      type: "listen_choice",
      chinese: word.simplified,
      pinyin: word.pinyin,
      prompt: "Listen and choose the correct meaning:",
      options,
      answer: word.english,
    });

    exercises.push({
      id: `lp-${word.id}`,
      type: "listen_pinyin",
      chinese: word.simplified,
      pinyin: word.pinyin,
      prompt: "Listen and choose the correct pinyin:",
      options: shuffle([
        word.pinyin,
        ...shuffle(words.filter((w) => w.id !== word.id))
          .slice(0, 3)
          .map((w) => w.pinyin),
      ]),
      answer: word.pinyin,
    });
  }

  const sentenceWords = words.filter((w) => w.simplified.length >= 2).slice(0, 4);
  for (const word of sentenceWords) {
    const first = word.simplified[0];
    exercises.push({
      id: `fb-${word.id}`,
      type: "fill_blank",
      chinese: word.simplified,
      pinyin: word.pinyin,
      prompt: `Listen and type the missing character (${word.english}):`,
      options: [],
      answer: first,
    });
  }

  return shuffle(exercises).slice(0, 10);
}

export type DictationExercise = {
  id: string;
  chinese: string;
  pinyin: string;
  pinyinNumber: string;
  english: string;
};

// 听写练习：播放发音，输入汉字或拼音
export function buildDictationExercises(words: WordInput[]): DictationExercise[] {
  return shuffle(words)
    .slice(0, 8)
    .map((w) => ({
      id: w.id,
      chinese: w.simplified,
      pinyin: w.pinyin,
      pinyinNumber: w.pinyinNumber,
      english: w.english,
    }));
}

// 归一化后比较：汉字、声调数字拼音、带声调拼音三种形式任一正确即算对
export function checkDictationAnswer(
  input: string,
  exercise: Pick<DictationExercise, "chinese" | "pinyin" | "pinyinNumber">,
): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[\s'’·]/g, "");
  const answer = normalize(input);
  if (!answer) return false;
  return (
    answer === normalize(exercise.chinese) ||
    answer === normalize(exercise.pinyinNumber) ||
    answer === normalize(exercise.pinyin)
  );
}

export function buildSpeakingPhrases(
  words: WordInput[],
  extraPhrases: SpeakingPhrase[] = [],
): SpeakingPhrase[] {
  const fromWords = words.slice(0, 6).map((w) => ({
    id: w.id,
    chinese: w.simplified,
    pinyin: w.pinyin,
    english: w.english,
  }));

  return [...extraPhrases, ...fromWords].slice(0, 8);
}

export function buildTypingExercises(words: WordInput[]): TypingExercise[] {
  return words.slice(0, 10).map((w) => ({
    id: w.id,
    chinese: w.simplified,
    pinyin: w.pinyin,
    pinyinNumber: w.pinyinNumber,
    english: w.english,
    hint: `Type pinyin with number tones for: ${w.english}`,
  }));
}
