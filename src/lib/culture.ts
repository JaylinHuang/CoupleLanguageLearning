export type CultureArticle = {
  id: string;
  title: string;
  subtitle: string;
  sections: Array<{
    heading: string;
    body: string;
    phrases?: Array<{
      chinese: string;
      pinyin: string;
      english: string;
    }>;
  }>;
};

export const cultureArticles: CultureArticle[] = [
  {
    id: "addressing-elders",
    title: "Addressing Elders",
    subtitle: "How to call your partner's family politely",
    sections: [
      {
        heading: "Why it matters",
        body: "In China, how you address people shows respect. Never call elders by their first name only. Use family titles even before you meet them on video calls.",
      },
      {
        heading: "Key titles",
        body: "Learn these before meeting your partner's parents:",
        phrases: [
          { chinese: "叔叔", pinyin: "shūshu", english: "uncle (father's younger brother; polite for men)" },
          { chinese: "阿姨", pinyin: "āyí", english: "aunt (polite for women)" },
          { chinese: "爷爷", pinyin: "yéye", english: "grandfather" },
          { chinese: "奶奶", pinyin: "nǎinai", english: "grandmother" },
        ],
      },
      {
        heading: "Tip from your tutor",
        body: "When unsure, your partner's parents can tell you what to call them. A warm 你好 and a smile go a long way!",
      },
    ],
  },
  {
    id: "dining-etiquette",
    title: "Dining Etiquette",
    subtitle: "Table manners when eating with family",
    sections: [
      {
        heading: "Basics",
        body: "Wait for elders to start eating first. Don't stick chopsticks upright in rice — it looks like incense at a funeral.",
      },
      {
        heading: "Useful phrases",
        body: "Practice these at the table:",
        phrases: [
          { chinese: "请", pinyin: "qǐng", english: "please (offer food)" },
          { chinese: "谢谢", pinyin: "xièxie", english: "thank you" },
          { chinese: "不客气", pinyin: "bú kèqi", english: "you're welcome" },
          { chinese: "好吃", pinyin: "hǎochī", english: "delicious" },
        ],
      },
      {
        heading: "Compliments",
        body: "Saying 好吃 (delicious) makes everyone happy. Try 请 slow and polite when offering or receiving food.",
      },
    ],
  },
  {
    id: "meeting-family",
    title: "Meeting the Family",
    subtitle: "First impressions on video or in person",
    sections: [
      {
        heading: "Greeting",
        body: "Start simple: introduce yourself, say you're happy to meet them, and thank them for their time.",
        phrases: [
          { chinese: "叔叔好，阿姨好！", pinyin: "Shūshu hǎo, āyí hǎo!", english: "Hello uncle, hello aunt!" },
          { chinese: "很高兴认识您。", pinyin: "Hěn gāoxìng rènshi nín.", english: "Nice to meet you (respectful)." },
          { chinese: "谢谢你们的关心。", pinyin: "Xièxie nǐmen de guānxīn.", english: "Thank you for your care." },
        ],
      },
      {
        heading: "Long-distance",
        body: "If you and your partner are far apart, family may ask about your daily life. Short, honest answers in simple Chinese are perfect.",
      },
    ],
  },
];
