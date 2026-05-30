export type Locale = "en" | "zh-TW";

export const LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "zh-TW", label: "繁體中文", flag: "🇹🇼" },
];

export type Messages = typeof enMessages;

export const enMessages = {
  app: {
    title: "Music Staff",
    subtitle: "Click on the staff lines or spaces to add or remove notes",
  },
  staff: {
    emptyHint: "Click here to start composing",
    notesCount: "{count} marks",
    clearAll: "Clear All",
  },
  controls: {
    note: "Note",
    rest: "Rest",
    half: "Half",
    quarter: "Quarter",
    eighth: "Eighth",
    sixteenth: "Sixteenth",
    flat: "Flat",
    natural: "Natural",
    sharp: "Sharp",
    accent: "Accent",
    tuplet: "Triplet",
    slur: "Slur",
    play: "Play",
    pause: "Pause",
    stop: "Stop",
  },
  seo: {
    title: "Music Staff - Free Online Music Notation Editor",
    description:
      "Create, edit, and play music notation online. Free interactive music staff with support for notes, rests, accidentals, accents, tuplets, slurs, beaming, and playback. Perfect for composers, students, and music teachers.",
    keywords: [
      "music staff",
      "music notation",
      "online music editor",
      "sheet music",
      "music composition",
      "五線譜",
      "music teacher tool",
      "free music software",
    ],
    ogTitle: "Music Staff - Interactive Online Music Notation Editor",
    ogDescription:
      "Create, edit, and play music notation in your browser. Free and easy to use.",
  },
};

export const zhTWMessages: Messages = {
  app: {
    title: "五線譜",
    subtitle: "點擊五線譜的線或空間來加入或移除音符",
  },
  staff: {
    emptyHint: "點擊此處開始作曲",
    notesCount: "{count} 個記號",
    clearAll: "清除全部",
  },
  controls: {
    note: "音符",
    rest: "休止符",
    half: "二分",
    quarter: "四分",
    eighth: "八分",
    sixteenth: "十六分",
    flat: "降記號",
    natural: "還原記號",
    sharp: "升記號",
    accent: "重音",
    tuplet: "連音",
    slur: "圓滑線",
    play: "播放",
    pause: "暫停",
    stop: "停止",
  },
  seo: {
    title: "五線譜 - 免費線上音樂編輯器",
    description:
      "免費線上五線譜編輯器，支援音符、休止符、升降記號、重音、三連音、圓滑線、連線及播放功能。適合作曲家、學生和音樂教師使用。",
    keywords: [
      "五線譜",
      "音樂編輯",
      "線上樂譜",
      "音樂創作",
      "免費音樂軟體",
      "music staff",
      "sheet music",
      "music notation",
    ],
    ogTitle: "五線譜 - 免費線上音樂記譜編輯器",
    ogDescription: "在瀏覽器中創作、編輯和播放樂譜。免費且易於使用。",
  },
};

export function getMessages(locale: Locale): Messages {
  switch (locale) {
    case "en":
      return enMessages;
    case "zh-TW":
      return zhTWMessages;
  }
}
