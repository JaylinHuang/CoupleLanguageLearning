import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const hsk1Words = [
  { simplified: "你", pinyin: "nǐ", pinyinNumber: "ni3", english: "you" },
  { simplified: "好", pinyin: "hǎo", pinyinNumber: "hao3", english: "good" },
  { simplified: "我", pinyin: "wǒ", pinyinNumber: "wo3", english: "I, me" },
  { simplified: "是", pinyin: "shì", pinyinNumber: "shi4", english: "to be" },
  { simplified: "的", pinyin: "de", pinyinNumber: "de5", english: "possessive particle" },
  { simplified: "爱", pinyin: "ài", pinyinNumber: "ai4", english: "to love" },
  { simplified: "想", pinyin: "xiǎng", pinyinNumber: "xiang3", english: "to miss, to want" },
  { simplified: "很", pinyin: "hěn", pinyinNumber: "hen3", english: "very" },
  { simplified: "漂亮", pinyin: "piàoliang", pinyinNumber: "piao4liang5", english: "beautiful" },
  { simplified: "谢谢", pinyin: "xièxie", pinyinNumber: "xie4xie5", english: "thank you" },
  { simplified: "再见", pinyin: "zàijiàn", pinyinNumber: "zai4jian4", english: "goodbye" },
  { simplified: "今天", pinyin: "jīntiān", pinyinNumber: "jin1tian1", english: "today" },
  { simplified: "明天", pinyin: "míngtiān", pinyinNumber: "ming2tian1", english: "tomorrow" },
  { simplified: "晚上", pinyin: "wǎnshang", pinyinNumber: "wan3shang5", english: "evening" },
  { simplified: "老婆", pinyin: "lǎopó", pinyinNumber: "lao3po2", english: "wife (affectionate)", tagalogShort: "asawa (babae)" },
  { simplified: "亲爱的", pinyin: "qīn'ài de", pinyinNumber: "qin1ai4de5", english: "dear, darling" },
  { simplified: "晚安", pinyin: "wǎn'ān", pinyinNumber: "wan3an1", english: "good night" },
  { simplified: "名字", pinyin: "míngzi", pinyinNumber: "ming2zi5", english: "name" },
  { simplified: "什么", pinyin: "shénme", pinyinNumber: "shen2me5", english: "what" },
  { simplified: "高兴", pinyin: "gāoxìng", pinyinNumber: "gao1xing4", english: "happy, glad" },
  { simplified: "打电话", pinyin: "dǎ diànhuà", pinyinNumber: "da3 dian4hua4", english: "to make a phone call" },
  { simplified: "怎么样", pinyin: "zěnmeyàng", pinyinNumber: "zen3me5yang4", english: "how is it / how are things" },
  { simplified: "爸爸", pinyin: "bàba", pinyinNumber: "ba4ba5", english: "dad / father" },
  { simplified: "妈妈", pinyin: "māma", pinyinNumber: "ma1ma5", english: "mom / mother" },
  { simplified: "叔叔", pinyin: "shūshu", pinyinNumber: "shu1shu5", english: "uncle" },
  { simplified: "阿姨", pinyin: "āyí", pinyinNumber: "a1yi2", english: "aunt" },
  { simplified: "请", pinyin: "qǐng", pinyinNumber: "qing3", english: "please" },
  { simplified: "不客气", pinyin: "bú kèqi", pinyinNumber: "bu2 ke4qi5", english: "you're welcome" },
  { simplified: "认识", pinyin: "rènshi", pinyinNumber: "ren4shi5", english: "to know / meet" },
];

async function main() {
  const learnerPassword = process.env.LEARNER_PASSWORD ?? "learner2024";
  const tutorPassword = process.env.TUTOR_PASSWORD ?? "tutor2024";

  const learnerHash = await bcrypt.hash(learnerPassword, 10);
  const tutorHash = await bcrypt.hash(tutorPassword, 10);

  await prisma.user.upsert({
    where: { username: "learner" },
    update: {
      passwordHash: learnerHash,
      email: "learner@local.dev",
      emailVerified: new Date(),
      displayName: "Learner",
      platformRole: "MEMBER",
    },
    create: {
      username: "learner",
      email: "learner@local.dev",
      emailVerified: new Date(),
      displayName: "Learner",
      role: "LEARNER",
      platformRole: "MEMBER",
      passwordHash: learnerHash,
      progress: { create: {} },
    },
  });

  await prisma.user.upsert({
    where: { username: "tutor" },
    update: {
      passwordHash: tutorHash,
      email: "tutor@local.dev",
      emailVerified: new Date(),
      displayName: "Tutor",
      platformRole: "MEMBER",
    },
    create: {
      username: "tutor",
      email: "tutor@local.dev",
      emailVerified: new Date(),
      displayName: "Tutor",
      role: "ADMIN",
      platformRole: "MEMBER",
      passwordHash: tutorHash,
      progress: { create: {} },
    },
  });

  const opsPassword = process.env.OPS_PASSWORD ?? "ops2024";
  const opsHash = await bcrypt.hash(opsPassword, 10);
  await prisma.user.upsert({
    where: { username: "ops" },
    update: {
      passwordHash: opsHash,
      email: "ops@local.dev",
      emailVerified: new Date(),
      platformRole: "PLATFORM_ADMIN",
      role: "ADMIN",
    },
    create: {
      username: "ops",
      email: "ops@local.dev",
      emailVerified: new Date(),
      displayName: "Platform Ops",
      role: "ADMIN",
      platformRole: "PLATFORM_ADMIN",
      passwordHash: opsHash,
    },
  });

  for (const w of hsk1Words) {
    await prisma.word.upsert({
      where: { id: `seed-${w.simplified}` },
      update: {
        pinyin: w.pinyin,
        pinyinNumber: w.pinyinNumber,
        english: w.english,
        tagalogShort: "tagalogShort" in w ? w.tagalogShort : undefined,
      },
      create: {
        id: `seed-${w.simplified}`,
        simplified: w.simplified,
        pinyin: w.pinyin,
        pinyinNumber: w.pinyinNumber,
        english: w.english,
        tagalogShort: "tagalogShort" in w ? w.tagalogShort : undefined,
        hskLevel: 1,
        isCustom: w.simplified === "老婆" || w.simplified === "亲爱的",
      },
    });
  }

  const lesson1Content = {
    intro:
      "Welcome! Let's start with greetings and sweet couple words. Example explanations are in English.",
    sentences: [
      {
        chinese: "你好！",
        pinyin: "Nǐ hǎo!",
        pinyinNumber: "Ni3 hao3!",
        english: "Hello!",
      },
      {
        chinese: "我是学生。",
        pinyin: "Wǒ shì xuésheng.",
        pinyinNumber: "Wo3 shi4 xue2sheng5.",
        english: "I am a student.",
      },
      {
        chinese: "很高兴。",
        pinyin: "Hěn gāoxìng.",
        pinyinNumber: "Hen3 gao1xing4.",
        english: "Nice to meet you. / Very happy.",
      },
    ],
    typingPrompts: [
      { answer: "你好", pinyinNumber: "ni3hao3", hint: "Hello (two characters)" },
      { answer: "我", pinyinNumber: "wo3", hint: "I / me" },
    ],
    quiz: [
      {
        type: "listen_choice",
        prompt: "What does 你好 mean?",
        audioText: "你好",
        options: ["Hello", "Goodbye", "Thank you", "Good night"],
        answer: "Hello",
      },
      {
        type: "fill_blank",
        prompt: "Complete: ___ 是学生",
        answer: "我",
      },
    ],
  };

  const lesson2Content = {
    intro: "Words couples use — practice affectionate phrases.",
    sentences: [
      {
        chinese: "老婆，你好！",
        pinyin: "Lǎopó, nǐ hǎo!",
        pinyinNumber: "Lao3po2, ni3 hao3!",
        english: "Hey wife, hello!",
      },
      {
        chinese: "我很想你。",
        pinyin: "Wǒ hěn xiǎng nǐ.",
        pinyinNumber: "Wo3 hen3 xiang3 ni3.",
        english: "I miss you a lot.",
      },
      {
        chinese: "亲爱的，晚安。",
        pinyin: "Qīn'ài de, wǎn'ān.",
        pinyinNumber: "Qin1ai4 de5, wan3an1.",
        english: "Good night, dear.",
      },
    ],
    typingPrompts: [
      { answer: "老婆", pinyinNumber: "lao3po2", hint: "wife (affectionate)" },
      { answer: "想你", pinyinNumber: "xiang3ni3", hint: "miss you" },
    ],
    quiz: [
      {
        type: "listen_choice",
        prompt: "What does 老婆 mean in a couple context?",
        options: ["wife (affectionate)", "friend", "sister", "teacher"],
        answer: "wife (affectionate)",
      },
      {
        type: "fill_blank",
        prompt: "Good night: ___",
        answer: "晚安",
      },
    ],
  };

  const lesson3Content = {
    intro: "Practice a short video call with your partner after school.",
    sentences: [
      {
        chinese: "喂，老婆！",
        pinyin: "Wéi, lǎopó!",
        pinyinNumber: "Wei2, lao3po2!",
        english: "Hey, wife! (on the phone)",
      },
      {
        chinese: "今天怎么样？",
        pinyin: "Jīntiān zěnmeyàng?",
        pinyinNumber: "Jin1tian1 zen3me5yang4?",
        english: "How was your day?",
      },
      {
        chinese: "我很想你。",
        pinyin: "Wǒ hěn xiǎng nǐ.",
        pinyinNumber: "Wo3 hen3 xiang3 ni3.",
        english: "I miss you a lot.",
      },
    ],
    typingPrompts: [
      { answer: "怎么样", pinyinNumber: "zen3me5yang4", hint: "how are things" },
      { answer: "打电话", pinyinNumber: "da3dian4hua4", hint: "make a phone call" },
    ],
    quiz: [
      {
        type: "listen_choice",
        prompt: "What does 今天怎么样 mean?",
        audioText: "今天怎么样",
        options: ["How was your day?", "Good night", "Thank you", "Goodbye"],
        answer: "How was your day?",
      },
      {
        type: "fill_blank",
        prompt: "I miss you: 我很___你",
        answer: "想",
      },
    ],
  };

  const lesson4Content = {
    intro: "Prepare to meet your partner's family — polite greetings and titles.",
    sentences: [
      {
        chinese: "叔叔好，阿姨好！",
        pinyin: "Shūshu hǎo, āyí hǎo!",
        pinyinNumber: "Shu1shu5 hao3, a1yi2 hao3!",
        english: "Hello uncle, hello aunt!",
      },
      {
        chinese: "很高兴认识您。",
        pinyin: "Hěn gāoxìng rènshi nín.",
        pinyinNumber: "Hen3 gao1xing4 ren4shi5 nin2.",
        english: "Nice to meet you (respectful).",
      },
      {
        chinese: "请。",
        pinyin: "Qǐng.",
        pinyinNumber: "Qing3.",
        english: "Please. (offering / polite)",
      },
    ],
    typingPrompts: [
      { answer: "叔叔", pinyinNumber: "shu1shu5", hint: "uncle" },
      { answer: "阿姨", pinyinNumber: "a1yi2", hint: "aunt" },
    ],
    quiz: [
      {
        type: "listen_choice",
        prompt: "How do you politely say aunt?",
        options: ["阿姨", "老婆", "老师", "同学"],
        answer: "阿姨",
      },
      {
        type: "fill_blank",
        prompt: "You're welcome: ___",
        answer: "不客气",
      },
    ],
  };

  const lessons = [
    {
      id: "lesson-1-hello",
      title: "Hello & Introduction",
      description: "Basic greetings and self-introduction",
      hskLevel: 1,
      sceneTag: "basics",
      order: 1,
      wordIds: ["seed-你", "seed-好", "seed-我", "seed-是", "seed-很", "seed-高兴"],
      content: lesson1Content,
    },
    {
      id: "lesson-2-couple",
      title: "Couple Phrases",
      description: "Sweet phrases between partners",
      hskLevel: 1,
      sceneTag: "couple",
      order: 2,
      wordIds: [
        "seed-老婆",
        "seed-亲爱的",
        "seed-爱",
        "seed-想",
        "seed-很",
        "seed-晚安",
      ],
      content: lesson2Content,
    },
    {
      id: "lesson-3-call",
      title: "Video Call Practice",
      description: "After school — how was your day?",
      hskLevel: 1,
      sceneTag: "couple",
      order: 3,
      wordIds: [
        "seed-老婆",
        "seed-今天",
        "seed-怎么样",
        "seed-想",
        "seed-很",
        "seed-打电话",
      ],
      content: lesson3Content,
    },
    {
      id: "lesson-4-family",
      title: "Meeting the Family",
      description: "Greet uncle and aunt politely",
      hskLevel: 1,
      sceneTag: "family",
      order: 4,
      wordIds: [
        "seed-叔叔",
        "seed-阿姨",
        "seed-请",
        "seed-不客气",
        "seed-认识",
        "seed-高兴",
      ],
      content: lesson4Content,
    },
  ];

  for (const lesson of lessons) {
    await prisma.lesson.upsert({
      where: { id: lesson.id },
      update: {
        title: lesson.title,
        description: lesson.description,
        content: JSON.stringify(lesson.content),
      },
      create: {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        hskLevel: lesson.hskLevel,
        sceneTag: lesson.sceneTag,
        order: lesson.order,
        content: JSON.stringify(lesson.content),
        published: true,
      },
    });

    for (let i = 0; i < lesson.wordIds.length; i += 1) {
      await prisma.lessonWord.upsert({
        where: {
          lessonId_wordId: {
            lessonId: lesson.id,
            wordId: lesson.wordIds[i],
          },
        },
        update: { order: i },
        create: {
          lessonId: lesson.id,
          wordId: lesson.wordIds[i],
          order: i,
        },
      });
    }
  }

  const partnerPhrases = [
    {
      chinese: "老婆",
      pinyin: "lǎopó",
      english: "wife (affectionate)",
    },
    {
      chinese: "亲爱的",
      pinyin: "qīn'ài de",
      english: "dear / darling",
    },
    {
      chinese: "我很想你",
      pinyin: "wǒ hěn xiǎng nǐ",
      english: "I miss you a lot",
    },
    {
      chinese: "晚安",
      pinyin: "wǎn'ān",
      english: "good night",
    },
    {
      chinese: "今天怎么样？",
      pinyin: "jīntiān zěnmeyàng?",
      english: "How was your day?",
    },
  ];

  await prisma.personCard.upsert({
    where: { id: "person-lin" },
    update: {
      name: "Partner",
      relation: "Partner",
      phrases: JSON.stringify(partnerPhrases),
    },
    create: {
      id: "person-lin",
      name: "Partner",
      relation: "Partner",
      phrases: JSON.stringify(partnerPhrases),
      order: 1,
    },
  });

  console.log("Seed complete.");
  console.log(`  Learner: learner / ${learnerPassword} (email learner@local.dev)`);
  console.log(`  Tutor:   tutor / ${tutorPassword} (email tutor@local.dev)`);
  console.log(`  Ops:     ops / ${opsPassword} (PLATFORM_ADMIN, local /ops)`);
  console.log("  Next: run SQL add_couple_platform.sql then npm run db:backfill-platform");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
