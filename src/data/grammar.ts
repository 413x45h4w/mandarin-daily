export interface GrammarQuiz {
  prompt: string;
  options: string[];
  answer: number;
}

export interface GrammarPoint {
  id: string;
  /** Classic HSK 2.0 level where this point is taught. */
  h: number;
  /** New HSK 3.0 band. Bands 8–9 are the harder half of the source’s single 7–9 list. */
  b: number;
  title: string;
  titleEn: string;
  /** Words the lesson is allowed to introduce even when they sit above the surrounding vocabulary. */
  pattern: string[];
  explain: string;
  explainEn: string;
  examples: { zh: string; en: string }[];
  quiz: GrammarQuiz[];
}

export const GRAMMAR: GrammarPoint[] = [
  {
    id: 'g-shi', h: 1, b: 1, pattern: ['是'], title: '是', titleEn: '是 — to be',
    explain: '“是” 说我是什么人。我是学生。你是老师吗？',
    explainEn: '是 links who someone is with what they are. 我是学生 means “I am a student.”',
    examples: [
      { zh: '我是学生。', en: 'I am a student.' },
      { zh: '她是老师。', en: 'She is a teacher.' },
    ],
    quiz: [
      { prompt: '我___学生。', options: ['是', '的', '吗', '呢'], answer: 0 },
      { prompt: '她是老师___？', options: ['吗', '的', '和', '都'], answer: 0 },
    ],
  },
  {
    id: 'g-de', h: 1, b: 1, pattern: ['的'], title: '的', titleEn: '的 — possession',
    explain: '“的” 说这个东西是谁的。我的书。老师的杯子。',
    explainEn: '的 sits between an owner and a thing. 我的书 is “my book.”',
    examples: [
      { zh: '我的书在家。', en: 'My book is at home.' },
      { zh: '这是老师的杯子。', en: 'This is the teacher’s cup.' },
    ],
    quiz: [
      { prompt: '这是我___书。', options: ['的', '是', '吗', '不'], answer: 0 },
      { prompt: '老师___杯子在哪儿？', options: ['的', '吗', '呢', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-ma', h: 1, b: 1, pattern: ['吗'], title: '吗', titleEn: '吗 — yes/no questions',
    explain: '“吗” 在后面。你是学生吗？你喜欢茶吗？',
    explainEn: '吗 turns a statement into a yes/no question and goes at the end.',
    examples: [
      { zh: '你是中国人吗？', en: 'Are you Chinese?' },
      { zh: '你喜欢喝茶吗？', en: 'Do you like drinking tea?' },
    ],
    quiz: [
      { prompt: '你喜欢汉语___？', options: ['吗', '的', '是', '不'], answer: 0 },
      { prompt: '你是学生___？', options: ['吗', '的', '是', '不'], answer: 0 },
    ],
  },
  {
    id: 'g-ne', h: 1, b: 1, pattern: ['呢'], title: '呢', titleEn: '呢 — and you?',
    explain: '“呢” 在后面。我是学生，你呢？',
    explainEn: '呢 bounces the same question back, or asks where something is. 你呢 means “and you?”',
    examples: [
      { zh: '我喝茶，你呢？', en: 'I drink tea. And you?' },
      { zh: '我的书呢？', en: 'Where is my book?' },
    ],
    quiz: [
      { prompt: '我是学生，你___？', options: ['呢', '吗', '的', '不'], answer: 0 },
      { prompt: '爸爸___？', options: ['呢', '的', '是', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-bu', h: 1, b: 1, pattern: ['不'], title: '不', titleEn: '不 — not',
    explain: '“不” 说不是。我不是老师。我不喝茶。',
    explainEn: '不 negates 是, adjectives, and most actions. 我不是老师 means “I am not a teacher.”',
    examples: [
      { zh: '我不是学生。', en: 'I am not a student.' },
      { zh: '今天不冷。', en: 'It is not cold today.' },
    ],
    quiz: [
      { prompt: '我___是老师。', options: ['不', '没', '吗', '的'], answer: 0 },
      { prompt: '她不___茶。', options: ['喝', '是', '的', '呢'], answer: 0 },
    ],
  },
  {
    id: 'g-mei', h: 1, b: 1, pattern: ['没'], title: '没', titleEn: '没 — did not / do not have',
    explain: '“没” 说现在没有。我没钱。我没看书。',
    explainEn: '没 negates 有 and says an action did not happen. 我没看书 means “I did not read.”',
    examples: [
      { zh: '我没钱。', en: 'I do not have money.' },
      { zh: '我没看电影。', en: 'I did not watch a movie.' },
    ],
    quiz: [
      { prompt: '我___看书。', options: ['没', '不', '吗', '的'], answer: 0 },
      { prompt: '她没___。', options: ['钱', '吗', '呢', '的'], answer: 0 },
    ],
  },
  {
    id: 'g-zai', h: 1, b: 1, pattern: ['在'], title: '在', titleEn: '在 — at a place',
    explain: '“在” 说人在哪儿。爸爸在家。我在学校。',
    explainEn: '在 puts someone in a place. 爸爸在家 means “Dad is at home.”',
    examples: [
      { zh: '医生在医院。', en: 'The doctor is at the hospital.' },
      { zh: '我们在学校看书。', en: 'We are reading at school.' },
    ],
    quiz: [
      { prompt: '妈妈___家。', options: ['在', '是', '的', '吗'], answer: 0 },
      { prompt: '老师在___。', options: ['学校', '吗', '呢', '的'], answer: 0 },
    ],
  },
  {
    id: 'g-xiang', h: 1, b: 1, pattern: ['想'], title: '想', titleEn: '想 — want to',
    explain: '“想” 说人喜欢做的事。我想喝茶。她想看电影。',
    explainEn: '想 before a verb means you want to do it. 我想喝茶 means “I want to drink tea.”',
    examples: [
      { zh: '我想去北京。', en: 'I want to go to Beijing.' },
      { zh: '你想吃什么？', en: 'What do you want to eat?' },
    ],
    quiz: [
      { prompt: '我___喝茶。', options: ['想', '在', '的', '吗'], answer: 0 },
      { prompt: '她想___电影。', options: ['看', '是', '的', '呢'], answer: 0 },
    ],
  },
  {
    id: 'g-hui', h: 1, b: 1, pattern: ['会'], title: '会', titleEn: '会 — can (a skill)',
    explain: '“会” 说人能做。我会说汉语。你不会写字吗？',
    explainEn: '会 means you know how to do something. 我会说汉语 means “I can speak Chinese.”',
    examples: [
      { zh: '我会写字。', en: 'I can write characters.' },
      { zh: '他不会做饭。', en: 'He cannot cook.' },
    ],
    quiz: [
      { prompt: '我___说汉语。', options: ['会', '在', '的', '吗'], answer: 0 },
      { prompt: '她不会___字。', options: ['写', '是', '吗', '的'], answer: 0 },
    ],
  },
  {
    id: 'g-tai', h: 1, b: 1, pattern: ['太', '了'], title: '太……了', titleEn: '太……了 — too',
    explain: '“太” 的后面有 “了”。太冷了。太大了。太好了。',
    explainEn: '太…了 means “too” or “so.” 太冷了 means “it is too cold.”',
    examples: [
      { zh: '今天太热了。', en: 'It is too hot today.' },
      { zh: '这个杯子太大了。', en: 'This cup is too big.' },
    ],
    quiz: [
      { prompt: '今天太冷___。', options: ['了', '吗', '的', '呢'], answer: 0 },
      { prompt: '___大了。', options: ['太', '不', '在', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-he', h: 1, b: 1, pattern: ['和'], title: '和', titleEn: '和 — and',
    explain: '“和” 说我和你。我和你。妈妈和爸爸。',
    explainEn: '和 connects two people or things. 妈妈和爸爸 means “Mom and Dad.”',
    examples: [
      { zh: '我和朋友喝茶。', en: 'I drink tea with a friend.' },
      { zh: '老师和学生都在学校。', en: 'The teacher and the students are all at school.' },
    ],
    quiz: [
      { prompt: '我___你去商店。', options: ['和', '是', '吗', '的'], answer: 0 },
      { prompt: '妈妈和爸爸___在家。', options: ['都', '吗', '呢', '太'], answer: 0 },
    ],
  },
  {
    id: 'g-dou', h: 1, b: 1, pattern: ['都'], title: '都', titleEn: '都 — all',
    explain: '我们都是学生。我们都喝茶。我们都喜欢汉语。',
    explainEn: '都 means “all” or “both” and comes before the verb. 我们都是学生 means “we are all students.”',
    examples: [
      { zh: '我们都喜欢汉语。', en: 'We all like Chinese.' },
      { zh: '这些书都是我的。', en: 'These books are all mine.' },
    ],
    quiz: [
      { prompt: '我们___是学生。', options: ['都', '和', '吗', '太'], answer: 0 },
      { prompt: '这些书___是我的。', options: ['都', '吗', '的', '呢'], answer: 0 },
    ],
  },
  {
    id: 'g-ji', h: 1, b: 1, pattern: ['几', '多少'], title: '几 / 多少', titleEn: '几 and 多少 — how many',
    explain: '你几岁？这多少钱？你有几个杯子？',
    explainEn: '几 asks a small number. 多少 asks an amount. 你几岁 means “how old are you?”',
    examples: [
      { zh: '你有几个杯子？', en: 'How many cups do you have?' },
      { zh: '这个多少钱？', en: 'How much is this?' },
    ],
    quiz: [
      { prompt: '你___岁？', options: ['几', '吗', '的', '和'], answer: 0 },
      { prompt: '这___钱？', options: ['多少', '什么', '哪儿', '怎么'], answer: 0 },
    ],
  },
  {
    id: 'g-ye', h: 2, b: 1, pattern: ['也'], title: '也', titleEn: '也 — also',
    explain: '“也” 说她是，我也是。我是学生，她也是学生。',
    explainEn: '也 means “also” and goes before the verb. 她也是学生 means “she is also a student.”',
    examples: [
      { zh: '我也喝茶。', en: 'I drink tea too.' },
      { zh: '他是老师，我也是老师。', en: 'He is a teacher, and I am a teacher too.' },
    ],
    quiz: [
      { prompt: '我喜欢汉语，她___喜欢。', options: ['也', '都', '吗', '的'], answer: 0 },
      { prompt: '你去学校，我___去。', options: ['也', '在', '太', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-bi', h: 2, b: 1, pattern: ['比'], title: '比', titleEn: '比 — comparison',
    explain: '“比” 说谁高，谁大。我哥哥比我高。今天比昨天热。',
    explainEn: 'A 比 B + adjective. 哥哥比我高 means “my older brother is taller than me.”',
    examples: [
      { zh: '他比我大。', en: 'He is older than me.' },
      { zh: '这个比那个贵。', en: 'This one is more expensive than that one.' },
    ],
    quiz: [
      { prompt: '哥哥___我高。', options: ['比', '也', '都', '和'], answer: 0 },
      { prompt: '今天比昨天___。', options: ['热', '吗', '的', '呢'], answer: 0 },
    ],
  },
  {
    id: 'g-zhengzai', h: 2, b: 1, pattern: ['正在'], title: '正在', titleEn: '正在 — in the middle of',
    explain: '“正在” 说现在做的事。我正在看书。外面正在下雨。',
    explainEn: '正在 means an action is in progress. 我正在看书 means “I am reading right now.”',
    examples: [
      { zh: '她正在打电话。', en: 'She is on the phone.' },
      { zh: '我们正在吃饭。', en: 'We are eating.' },
    ],
    quiz: [
      { prompt: '我___看书。', options: ['正在', '比', '太', '和'], answer: 0 },
      { prompt: '外面正在___。', options: ['下雨', '学生', '杯子', '名字'], answer: 0 },
    ],
  },
  {
    id: 'g-yao', h: 2, b: 1, pattern: ['要'], title: '要', titleEn: '要 — going to / want',
    explain: '“要” 说想做，或快做了。我要去学校。你要喝水吗？',
    explainEn: '要 means “want” or “be going to.” 我要去学校 means “I am going to school.”',
    examples: [
      { zh: '明天我要去北京。', en: 'I am going to Beijing tomorrow.' },
      { zh: '你要什么？', en: 'What do you want?' },
    ],
    quiz: [
      { prompt: '我___喝茶。', options: ['要', '比', '的', '呢'], answer: 0 },
      { prompt: '她明天要___家。', options: ['回', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-zhe', h: 2, b: 1, pattern: ['着'], title: '着', titleEn: '着 — a continuing state',
    explain: '“着” 在 “开” 的后面。门开着。她看着书。',
    explainEn: '着 after a verb marks a state that stays. 门开着 means “the door is open.”',
    examples: [
      { zh: '门开着。', en: 'The door is standing open.' },
      { zh: '她看着书。', en: 'She is looking at the book.' },
    ],
    quiz: [
      { prompt: '门开___。', options: ['着', '吗', '的', '比'], answer: 0 },
      { prompt: '他笑___说。', options: ['着', '了', '的', '吧'], answer: 0 },
    ],
  },
  {
    id: 'g-cong', h: 2, b: 1, pattern: ['从', '到'], title: '从……到', titleEn: '从……到 — from… to…',
    explain: '我从家到学校。从星期一到星期五我都工作。',
    explainEn: '从 marks the start and 到 marks the end. 从家到学校 means “from home to school.”',
    examples: [
      { zh: '我从家到医院。', en: 'I go from home to the hospital.' },
      { zh: '商店从九点到六点开。', en: 'The shop is open from nine to six.' },
    ],
    quiz: [
      { prompt: '我___家到学校。', options: ['从', '比', '也', '太'], answer: 0 },
      { prompt: '从学校___家，我坐出租车。', options: ['到', '吗', '的', '呢'], answer: 0 },
    ],
  },
  {
    id: 'g-jiu', h: 2, b: 1, pattern: ['就'], title: '就', titleEn: '就 — then / right away',
    explain: '“就” 说很快。我现在就去。你来，我就高兴。',
    explainEn: '就 means “right then” or “as soon as.” 我现在就去 means “I will go right now.”',
    examples: [
      { zh: '我明天就去北京。', en: 'I will go to Beijing tomorrow, no delay.' },
      { zh: '他一来，我们就吃饭。', en: 'As soon as he arrives, we eat.' },
    ],
    quiz: [
      { prompt: '我现在___去。', options: ['就', '从', '比', '太'], answer: 0 },
      { prompt: '你来，我___高兴。', options: ['就', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-hai', h: 2, b: 1, pattern: ['还'], title: '还', titleEn: '还 — still / also',
    explain: '“还” 说一个事还在，或还有一个。我还在学校。我还想喝茶。',
    explainEn: '还 means “still” or “in addition.” 我还在学校 means “I am still at school.”',
    examples: [
      { zh: '他还会说汉语。', en: 'He can also speak Chinese.' },
      { zh: '现在还早。', en: 'It is still early.' },
    ],
    quiz: [
      { prompt: '我___在家。', options: ['还', '比', '从', '太'], answer: 0 },
      { prompt: '她想喝茶，___想吃米饭。', options: ['还', '吗', '的', '呢'], answer: 0 },
    ],
  },
  {
    id: 'g-ba', h: 2, b: 1, pattern: ['吧'], title: '吧', titleEn: '吧 — suggestion',
    explain: '“吧” 在后面。我们走吧。你喝水吧。',
    explainEn: '吧 softens a suggestion. 我们走吧 means “let’s go.”',
    examples: [
      { zh: '我们坐公共汽车吧。', en: 'Let’s take the bus.' },
      { zh: '你慢慢说吧。', en: 'Speak slowly, all right?' },
    ],
    quiz: [
      { prompt: '我们去学校___。', options: ['吧', '吗', '的', '比'], answer: 0 },
      { prompt: '你休息___。', options: ['吧', '从', '太', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-yinwei', h: 2, b: 2, pattern: ['因为', '所以'], title: '因为……所以', titleEn: '因为……所以 — because',
    explain: '因为下雨，所以我没去。因为太忙，所以我没看书。',
    explainEn: '因为 gives the reason and 所以 gives the result. You can use one or both.',
    examples: [
      { zh: '因为太忙，所以我没看书。', en: 'I did not read because I was too busy.' },
      { zh: '我喜欢汉语，因为老师很好。', en: 'I like Chinese because the teacher is very good.' },
    ],
    quiz: [
      { prompt: '___下雨，所以我在家。', options: ['因为', '但是', '也', '就'], answer: 0 },
      { prompt: '因为冷，___我喝茶。', options: ['所以', '吗', '的', '比'], answer: 0 },
    ],
  },
  {
    id: 'g-danshi', h: 2, b: 2, pattern: ['但是'], title: '但是', titleEn: '但是 — but',
    explain: '我想去，但是今天下雨。这个很好，但是太贵。',
    explainEn: '但是 means “but” and starts the contrasting half of the sentence.',
    examples: [
      { zh: '这个很好，但是太贵。', en: 'This is good, but it is too expensive.' },
      { zh: '我会说汉语，但是说得不快。', en: 'I can speak Chinese, but not quickly.' },
    ],
    quiz: [
      { prompt: '我想去，___没时间。', options: ['但是', '因为', '所以', '吧'], answer: 0 },
      { prompt: '他很忙，但是他还___工作。', options: ['要', '吗', '的', '呢'], answer: 0 },
    ],
  },
  {
    id: 'g-de2', h: 2, b: 2, pattern: ['得'], title: '得', titleEn: '得 — how an action is done',
    explain: '“得” 在动词后面，说做得怎么样。他说得很慢。她唱得很好。',
    explainEn: 'Verb + 得 + description. 说得很慢 means “speaks very slowly.”',
    examples: [
      { zh: '请你说得慢一点儿。', en: 'Please speak a little more slowly.' },
      { zh: '他跑得很快。', en: 'He runs very fast.' },
    ],
    quiz: [
      { prompt: '她说___很慢。', options: ['得', '的', '了', '吗'], answer: 0 },
      { prompt: '他写得___好。', options: ['很', '吗', '吧', '从'], answer: 0 },
    ],
  },
  {
    id: 'g-yijing', h: 2, b: 2, pattern: ['已经'], title: '已经', titleEn: '已经 — already',
    explain: '我已经吃饭了。他已经去学校了。',
    explainEn: '已经 means “already,” often with 了. 我已经吃饭了 means “I have already eaten.”',
    examples: [
      { zh: '我已经会写这个字了。', en: 'I can already write this character.' },
      { zh: '我已经回家了。', en: 'I have already gone home.' },
    ],
    quiz: [
      { prompt: '我___吃饭了。', options: ['已经', '正在', '比', '从'], answer: 0 },
      { prompt: '他已经回家___。', options: ['了', '吗', '的', '吧'], answer: 0 },
    ],
  },
  {
    id: 'g-ba3', h: 3, b: 3, pattern: ['把'], title: '把', titleEn: '把 — dispose of something',
    explain: '请把门打开。我把书放在桌子上。',
    explainEn: '把 brings the object in front of the verb when you handle or change it. 请把门打开 means “please open the door.”',
    examples: [
      { zh: '请把门打开。', en: 'Please open the door.' },
      { zh: '她把杯子放在桌子上。', en: 'She put the cup on the table.' },
    ],
    quiz: [
      { prompt: '请___书打开。', options: ['把', '被', '让', '给'], answer: 0 },
      { prompt: '我把名字写在___上。', options: ['书', '吗', '的', '呢'], answer: 0 },
    ],
  },
  {
    id: 'g-bei', h: 3, b: 3, pattern: ['被'], title: '被', titleEn: '被 — passive',
    explain: '杯子被他拿走了。我的书被人看了。',
    explainEn: '被 marks the passive. 杯子被他打破了 means “the cup was broken by him.”',
    examples: [
      { zh: '书被老师拿走了。', en: 'The book was taken by the teacher.' },
      { zh: '杯子被人拿走了。', en: 'The cup was taken by someone.' },
    ],
    quiz: [
      { prompt: '杯子___他拿走了。', options: ['被', '把', '让', '从'], answer: 0 },
      { prompt: '我的车被朋友___了。', options: ['开', '吗', '的', '呢'], answer: 0 },
    ],
  },
  {
    id: 'g-suiran', h: 3, b: 2, pattern: ['虽然', '但是'], title: '虽然……但是', titleEn: '虽然……但是 — although',
    explain: '虽然很忙，但是我想学习。虽然下雨，我们还是去学校。',
    explainEn: '虽然 introduces a fact that does not stop the result after 但是.',
    examples: [
      { zh: '虽然下雨，我们还是去学校。', en: 'Even though it is raining, we still go to school.' },
      { zh: '这个虽然小，但是很有用。', en: 'This is small, but it is useful.' },
    ],
    quiz: [
      { prompt: '___冷，但是我还要去。', options: ['虽然', '因为', '如果', '为了'], answer: 0 },
      { prompt: '虽然贵，___我想买。', options: ['但是', '所以', '吗', '的'], answer: 0 },
    ],
  },
  {
    id: 'g-xian', h: 3, b: 2, pattern: ['先', '然后'], title: '先……然后', titleEn: '先……然后 — first… then…',
    explain: '“先” 是第一，“然后” 是后面。我们先吃饭，然后去看电影。',
    explainEn: '先 marks the first step and 然后 the next. 先吃饭，然后看电影 means “eat first, then see a movie.”',
    examples: [
      { zh: '你先写名字，然后读书。', en: 'Write your name first, then read.' },
      { zh: '我先回家，然后给你打电话。', en: 'I will go home first, then call you.' },
    ],
    quiz: [
      { prompt: '我们___学习，然后休息。', options: ['先', '才', '又', '被'], answer: 0 },
      { prompt: '先洗手，___吃饭。', options: ['然后', '因为', '吗', '的'], answer: 0 },
    ],
  },
  {
    id: 'g-yibian', h: 3, b: 1, pattern: ['一边'], title: '一边……一边', titleEn: '一边……一边 — at the same time',
    explain: '他一边走一边说话。我一边吃饭一边看电视。',
    explainEn: '一边 A 一边 B means two actions happen together.',
    examples: [
      { zh: '她一边听音乐一边写字。', en: 'She writes while listening to music.' },
      { zh: '不要一边开车一边打电话。', en: 'Do not drive and talk on the phone at the same time.' },
    ],
    quiz: [
      { prompt: '他一边走___说话。', options: ['一边', '然后', '因为', '但是'], answer: 0 },
      { prompt: '我___喝茶一边看书。', options: ['一边', '先', '才', '被'], answer: 0 },
    ],
  },
  {
    id: 'g-cai', h: 3, b: 2, pattern: ['才'], title: '才', titleEn: '才 — only then / as late as',
    explain: '“才” 说时间晚。他九点才来。你去，我才去。',
    explainEn: '才 means something happens later than expected, or only when a condition is met.',
    examples: [
      { zh: '我昨天十二点才睡觉。', en: 'I did not sleep until twelve last night.' },
      { zh: '看完书，我才明白。', en: 'Only after reading did I understand.' },
    ],
    quiz: [
      { prompt: '他晚上十点___回家。', options: ['才', '就', '正在', '从'], answer: 0 },
      { prompt: '你说，我___知道。', options: ['才', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-you', h: 3, b: 2, pattern: ['又'], title: '又', titleEn: '又 — again',
    explain: '今天又下雨了。他又来了。',
    explainEn: '又 means the same thing happened again. 今天又下雨了 means “it rained again today.”',
    examples: [
      { zh: '今天又下雨了。', en: 'It rained again today.' },
      { zh: '他又给妈妈打电话了。', en: 'He called his mom again.' },
    ],
    quiz: [
      { prompt: '今天___冷了。', options: ['又', '才', '被', '把'], answer: 0 },
      { prompt: '她又___了一个小时。', options: ['学', '吗', '的', '呢'], answer: 0 },
    ],
  },
  {
    id: 'g-ruguo', h: 3, b: 2, pattern: ['如果'], title: '如果', titleEn: '如果 — if',
    explain: '“如果” 说一个可能。如果下雨，我就不去。如果你有时间，请给我打电话。',
    explainEn: '如果 starts a condition. 如果下雨，我就不去 means “if it rains, I will not go.”',
    examples: [
      { zh: '如果你忙，我们就明天见。', en: 'If you are busy, we will meet tomorrow.' },
      { zh: '如果太贵，我就不买。', en: 'If it is too expensive, I will not buy it.' },
    ],
    quiz: [
      { prompt: '___你来，我就高兴。', options: ['如果', '虽然', '为了', '被'], answer: 0 },
      { prompt: '如果没时间，我___不去。', options: ['就', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-yue', h: 3, b: 2, pattern: ['越'], title: '越……越', titleEn: '越……越 — the more… the more…',
    explain: '两个 “越” 说一个变，另一个也变。他越说越快。我越学越喜欢。',
    explainEn: '越 A 越 B means the more of A, the more of B. 越说越快 means “the more he talks, the faster he gets.”',
    examples: [
      { zh: '雨越下越大。', en: 'The rain is getting heavier and heavier.' },
      { zh: '这本书我越看越有意思。', en: 'The more I read this book, the more interesting it is.' },
    ],
    quiz: [
      { prompt: '他越跑___快。', options: ['越', '又', '才', '就'], answer: 0 },
      { prompt: '我___看越明白。', options: ['越', '被', '把', '从'], answer: 0 },
    ],
  },
  {
    id: 'g-bijiao', h: 3, b: 3, pattern: ['比较'], title: '比较', titleEn: '比较 — relatively',
    explain: '今天比较冷。这个比较便宜。',
    explainEn: '比较 softens an adjective: “fairly” or “relatively.” 今天比较冷 means “it is fairly cold today.”',
    examples: [
      { zh: '这件衣服比较贵。', en: 'This piece of clothing is relatively expensive.' },
      { zh: '我比较喜欢喝茶。', en: 'I fairly prefer tea.' },
    ],
    quiz: [
      { prompt: '今天___热。', options: ['比较', '越', '被', '把'], answer: 0 },
      { prompt: '这条路比较___。', options: ['远', '吗', '的', '呢'], answer: 0 },
    ],
  },
  {
    id: 'g-weile', h: 3, b: 3, pattern: ['为了'], title: '为了', titleEn: '为了 — in order to',
    explain: '为了学习汉语，我每天看书。为了工作，他去北京。',
    explainEn: '为了 introduces the purpose. 为了学习汉语 means “in order to study Chinese.”',
    examples: [
      { zh: '为了赶上车，我跑得很快。', en: 'I ran fast in order to catch the bus.' },
      { zh: '她为了工作来到这个城市。', en: 'She came to this city for work.' },
    ],
    quiz: [
      { prompt: '___考试，他晚上还在学习。', options: ['为了', '虽然', '被', '把'], answer: 0 },
      { prompt: '为了健康，我每天___。', options: ['运动', '吗', '的', '呢'], answer: 0 },
    ],
  },
  {
    id: 'g-guo', h: 4, b: 1, pattern: ['过'], title: '过', titleEn: '过 — have ever',
    explain: '“过” 在动词后面，说以前有这样的经验。我去过北京。你吃过中国菜吗？',
    explainEn: '过 after a verb means you have had the experience. 我去过北京 means “I have been to Beijing.”',
    examples: [
      { zh: '我没坐过飞机。', en: 'I have never taken a plane.' },
      { zh: '他学过两年汉语。', en: 'He studied Chinese for two years at some point.' },
    ],
    quiz: [
      { prompt: '我去___上海。', options: ['过', '着', '得', '的'], answer: 0 },
      { prompt: '你看过这个电影___？', options: ['吗', '的', '和', '比'], answer: 0 },
    ],
  },
  {
    id: 'g-budan', h: 4, b: 2, pattern: ['不但', '而且'], title: '不但……而且', titleEn: '不但……而且 — not only… but also',
    explain: '“不但” 说一个，“而且” 说还有更进一步。他不但会说汉语，而且会写。',
    explainEn: '不但…而且 adds a stronger second point. “Not only… but also…”',
    examples: [
      { zh: '这里不但方便，而且安静。', en: 'This place is not only convenient but also quiet.' },
      { zh: '她不但帮忙，而且不说累。', en: 'She not only helps, she does not even say she is tired.' },
    ],
    quiz: [
      { prompt: '他___会开车，而且会修车。', options: ['不但', '虽然', '如果', '为了'], answer: 0 },
      { prompt: '不但便宜，___很好。', options: ['而且', '所以', '吗', '的'], answer: 0 },
    ],
  },
  {
    id: 'g-buguan', h: 4, b: 4, pattern: ['不管'], title: '不管……都', titleEn: '不管……都 — no matter',
    explain: '“不管” 说任何情况，“都” 说结果一样。不管天气怎么样，她都运动。',
    explainEn: '不管…都 means the result does not change with the condition. “No matter…”',
    examples: [
      { zh: '不管多忙，他都给家里打电话。', en: 'No matter how busy he is, he calls home.' },
      { zh: '不管你去不去，我都去。', en: 'Whether you go or not, I am going.' },
    ],
    quiz: [
      { prompt: '___多远，我都走。', options: ['不管', '因为', '为了', '被'], answer: 0 },
      { prompt: '不管谁来，我___欢迎。', options: ['都', '吗', '的', '呢'], answer: 0 },
    ],
  },
  {
    id: 'g-jiran', h: 4, b: 4, pattern: ['既然'], title: '既然', titleEn: '既然 — since (given that)',
    explain: '既然你来了，就一起吃饭吧。既然下雨，我们就改明天。',
    explainEn: '既然 means “since it is already the case.” 既然你来了，就吃饭吧 means “since you are here, let’s eat.”',
    examples: [
      { zh: '既然下雨，我们就改明天。', en: 'Since it is raining, let’s move it to tomorrow.' },
      { zh: '既然他同意，我们就开始。', en: 'Since he agrees, we will start.' },
    ],
    quiz: [
      { prompt: '___你有时间，就来吧。', options: ['既然', '不管', '被', '把'], answer: 0 },
      { prompt: '既然晚了，我们___回去。', options: ['就', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-daodi', h: 4, b: 3, pattern: ['到底'], title: '到底', titleEn: '到底 — what actually',
    explain: '“到底” 用在问句里，想知道真正的答案。你到底去不去？这到底是什么意思？',
    explainEn: '到底 presses for the real answer. 你到底去不去 means “are you actually going or not?”',
    examples: [
      { zh: '他到底什么时候来？', en: 'When on earth is he coming?' },
      { zh: '你到底明白了没有？', en: 'Do you actually understand now?' },
    ],
    quiz: [
      { prompt: '你___想买不买？', options: ['到底', '既然', '为了', '虽然'], answer: 0 },
      { prompt: '这到底是___意思？', options: ['什么', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-lian', h: 4, b: 3, pattern: ['连'], title: '连……都', titleEn: '连……都 — even',
    explain: '连孩子都会。我连水都没喝。',
    explainEn: '连…都/也 means “even.” 我连水都没喝 means “I did not even drink water.”',
    examples: [
      { zh: '连老师都不知道。', en: 'Even the teacher does not know.' },
      { zh: '他连一句汉语也不会说。', en: 'He cannot speak even one sentence of Chinese.' },
    ],
    quiz: [
      { prompt: '___我都明白了。', options: ['连', '把', '被', '从'], answer: 0 },
      { prompt: '他连饭___没吃。', options: ['都', '吗', '呢', '吧'], answer: 0 },
    ],
  },
  {
    id: 'g-qilai', h: 4, b: 1, pattern: ['起来'], title: '起来', titleEn: '起来 — start to / when you do it',
    explain: '他笑起来了。这个字写起来不难。',
    explainEn: '起来 can mean an action starts, or how it feels when you do it. 说起来容易 means “it is easy to say.”',
    examples: [
      { zh: '天气热起来了。', en: 'The weather has started to get hot.' },
      { zh: '这个字写起来不难。', en: 'This character is not hard to write.' },
    ],
    quiz: [
      { prompt: '雨下___了。', options: ['起来', '过', '得', '的'], answer: 0 },
      { prompt: '看起来___容易。', options: ['很', '吗', '和', '从'], answer: 0 },
    ],
  },
  {
    id: 'g-yushi', h: 4, b: 4, pattern: ['于是'], title: '于是', titleEn: '于是 — and so',
    explain: '他看见时间晚了，于是就跑。大家都累了，于是休息。',
    explainEn: '于是 means “and so” or “thereupon,” a result that follows at once.',
    examples: [
      { zh: '门关了，于是我们从后面走。', en: 'The door was shut, so we went around the back.' },
      { zh: '大家都累了，于是休息。', en: 'Everyone was tired, so we rested.' },
    ],
    quiz: [
      { prompt: '车来了，___他上车。', options: ['于是', '虽然', '如果', '为了'], answer: 0 },
      { prompt: '于是我们___回家。', options: ['就', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-jishi', h: 4, b: 5, pattern: ['即使'], title: '即使', titleEn: '即使 — even if',
    explain: '即使下雨，我也去。即使很晚，他也会打电话。',
    explainEn: '即使…也 means “even if,” including a case that may not happen.',
    examples: [
      { zh: '即使很晚，他也会打电话。', en: 'Even if it is late, he will call.' },
      { zh: '即使你不同意，我也要说。', en: 'Even if you disagree, I am going to say it.' },
    ],
    quiz: [
      { prompt: '___没人帮我，我也做。', options: ['即使', '于是', '既然', '比较'], answer: 0 },
      { prompt: '即使贵，我___想看。', options: ['也', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-faner', h: 5, b: 4, pattern: ['反而'], title: '反而', titleEn: '反而 — on the contrary',
    explain: '“反而” 说结果和你想的相反。我说了以后，他反而不高兴。',
    explainEn: '反而 marks a result that goes the other way from what you expected.',
    examples: [
      { zh: '休息以后，他反而更累。', en: 'After resting, he was even more tired.' },
      { zh: '便宜的那个反而更好。', en: 'The cheaper one turned out better.' },
    ],
    quiz: [
      { prompt: '我帮他，他___不高兴。', options: ['反而', '于是', '既然', '为了'], answer: 0 },
      { prompt: '说得越多，别人反而___不明白。', options: ['越', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-yaoshi', h: 5, b: 3, pattern: ['要是'], title: '要是', titleEn: '要是 — if',
    explain: '“要是” 和 “如果” 一样。要是你有空，我们出去走走。',
    explainEn: '要是 is a spoken “if,” close to 如果. 要是你有空 means “if you are free.”',
    examples: [
      { zh: '要是明天下雨，比赛就改时间。', en: 'If it rains tomorrow, the match will be rescheduled.' },
      { zh: '要是我，我就先问老师。', en: 'If it were me, I would ask the teacher first.' },
    ],
    quiz: [
      { prompt: '___来不及，就坐出租车。', options: ['要是', '反而', '于是', '连'], answer: 0 },
      { prompt: '要是你同意，我们___开始。', options: ['就', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-yidan', h: 5, b: 5, pattern: ['一旦'], title: '一旦', titleEn: '一旦 — once',
    explain: '“一旦” 说一个情况出现以后，后面的事就跟着来。一旦开始，就不要停。',
    explainEn: '一旦 means “once” a condition appears, the result follows.',
    examples: [
      { zh: '一旦决定，他就不会改。', en: 'Once he decides, he will not change it.' },
      { zh: '关系一旦坏了，就很难再好。', en: 'Once a relationship goes bad, it is hard to repair.' },
    ],
    quiz: [
      { prompt: '___习惯了，你就会喜欢。', options: ['一旦', '反而', '连', '把'], answer: 0 },
      { prompt: '一旦离开，就___回来了。', options: ['不', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-jinguan', h: 4, b: 5, pattern: ['尽管'], title: '尽管', titleEn: '尽管 — even though',
    explain: '尽管很难，他还是做完了。尽管大家反对，他还是去了。',
    explainEn: '尽管 means “even though,” a bit stronger than 虽然.',
    examples: [
      { zh: '尽管大家反对，他还是去了。', en: 'Even though everyone objected, he still went.' },
      { zh: '尽管很累，她还在笑。', en: 'Tired as she was, she was still smiling.' },
    ],
    quiz: [
      { prompt: '___下雨，比赛还是进行。', options: ['尽管', '于是', '为了', '因为'], answer: 0 },
      { prompt: '尽管贵，我还是___了。', options: ['买', '吗', '的', '呢'], answer: 0 },
    ],
  },
  {
    id: 'g-chufei', h: 5, b: 5, pattern: ['除非'], title: '除非', titleEn: '除非 — unless',
    explain: '除非你去，否则他不见。除非生病，他每天都来。',
    explainEn: '除非 means “unless.” The result happens only if that condition is met.',
    examples: [
      { zh: '除非生病，他每天都来。', en: 'Unless he is sick, he comes every day.' },
      { zh: '除非你说，别人不知道。', en: 'Nobody knows unless you say so.' },
    ],
    quiz: [
      { prompt: '___你同意，我们不开始。', options: ['除非', '尽管', '反而', '于是'], answer: 0 },
      { prompt: '除非下雨，___我都跑步。', options: ['否则', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-juran', h: 5, b: 5, pattern: ['居然'], title: '居然', titleEn: '居然 — to one’s surprise',
    explain: '他居然会做这个菜。这个很难，她居然做对了。',
    explainEn: '居然 marks a surprise. 他居然会 means “he actually can,” and you did not expect it.',
    examples: [
      { zh: '这个很难，她居然做对了。', en: 'This was hard, and she actually got it right.' },
      { zh: '我居然忘了他的名字。', en: 'I actually forgot his name.' },
    ],
    quiz: [
      { prompt: '他___没来。', options: ['居然', '除非', '为了', '把'], answer: 0 },
      { prompt: '今天很冷，花居然___开了。', options: ['还', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-ningke', h: 5, b: 7, pattern: ['宁可'], title: '宁可', titleEn: '宁可 — would rather',
    explain: '“宁可” 说你选择一个不太好的，也不要另一个。我宁可走，也不坐那辆车。',
    explainEn: '宁可 A 也不 B means you would rather do A than B.',
    examples: [
      { zh: '他宁可自己做，也不麻烦别人。', en: 'He would rather do it himself than bother others.' },
      { zh: '我宁可少睡，也要把这个看完。', en: 'I would rather sleep less than leave this unread.' },
    ],
    quiz: [
      { prompt: '我___在家，也不去。', options: ['宁可', '居然', '除非', '于是'], answer: 0 },
      { prompt: '宁可慢一点，___不要做错。', options: ['也', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-yuqi', h: 5, b: 7, pattern: ['与其', '不如'], title: '与其……不如', titleEn: '与其……不如 — rather than',
    explain: '“与其” 放下一个不太好的选择，“不如” 说更好的那个。与其等，不如现在做。',
    explainEn: '与其 A 不如 B means B is the better choice compared with A.',
    examples: [
      { zh: '与其担心，不如先问清楚。', en: 'Rather than worry, ask and get it clear.' },
      { zh: '与其买新的，不如把旧的修好。', en: 'Rather than buy a new one, fix the old one.' },
    ],
    quiz: [
      { prompt: '___等，不如现在做。', options: ['与其', '宁可', '居然', '即使'], answer: 0 },
      { prompt: '与其坐着，___出去走走。', options: ['不如', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-hekuang', h: 5, b: 7, pattern: ['何况'], title: '何况', titleEn: '何况 — let alone',
    explain: '“何况” 在一个更强的理由前面。大人都难，何况是孩子。',
    explainEn: '何况 means “let alone” or “all the more so.” The second case is even clearer.',
    examples: [
      { zh: '本地人有时也迷路，何况是第一次来的人。', en: 'Even locals get lost sometimes, let alone a first-time visitor.' },
      { zh: '平时都忙，何况是年底。', en: 'We are busy in ordinary times, especially at year-end.' },
    ],
    quiz: [
      { prompt: '老师都不确定，___是我。', options: ['何况', '与其', '宁可', '一旦'], answer: 0 },
      { prompt: '走路都累，何况还要___。', options: ['跑', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-nanmian', h: 6, b: 4, pattern: ['难免'], title: '难免', titleEn: '难免 — hard to avoid',
    explain: '“难免” 说一个情况不容易躲开。第一次做，难免紧张。',
    explainEn: '难免 means something is hard to avoid. 难免紧张 means “bound to be nervous.”',
    examples: [
      { zh: '刚开始，难免会错。', en: 'At the start, mistakes are hard to avoid.' },
      { zh: '两个人在一起很久，难免有不同的看法。', en: 'Two people together for a long time will have different views.' },
    ],
    quiz: [
      { prompt: '新的环境，___不习惯。', options: ['难免', '何况', '与其', '宁可'], answer: 0 },
      { prompt: '第一次做，难免会___。', options: ['错', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-ma6', h: 6, b: 6, pattern: ['嘛'], title: '嘛', titleEn: '嘛 — obvious tone',
    explain: '“嘛” 在后面。这很简单嘛。你先试试嘛。',
    explainEn: '嘛 at the end marks “that’s obvious” or a light push. 这很简单嘛 means “it’s simple, come on.”',
    examples: [
      { zh: '新人嘛，慢一点没关系。', en: 'They are new, so it is fine to be slow.' },
      { zh: '你答应了嘛，就做到。', en: 'You did agree, so follow through.' },
    ],
    quiz: [
      { prompt: '朋友之间___，不用说谢谢。', options: ['嘛', '何况', '除非', '把'], answer: 0 },
      { prompt: '先做完___。', options: ['嘛', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-miande', h: 6, b: 6, pattern: ['免得'], title: '免得', titleEn: '免得 — so as to avoid',
    explain: '“免得” 说为了不让后面的事发生。早点出门，免得迟到。',
    explainEn: '免得 means “so as to avoid.” 早点出门，免得迟到 means “leave early so you are not late.”',
    examples: [
      { zh: '你写下来，免得忘了。', en: 'Write it down so you do not forget.' },
      { zh: '我们先说好，免得以后吵架。', en: 'Let’s agree now to avoid a fight later.' },
    ],
    quiz: [
      { prompt: '多问一句，___做错。', options: ['免得', '嘛', '何况', '反而'], answer: 0 },
      { prompt: '带着伞，免得___。', options: ['淋雨', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-bale', h: 6, b: 6, pattern: ['罢了'], title: '罢了', titleEn: '罢了 — merely',
    explain: '我只是说说罢了，不是真的生气。',
    explainEn: '罢了 means “that’s all” or “merely,” playing something down.',
    examples: [
      { zh: '他不过是开玩笑罢了。', en: 'He was only joking.' },
      { zh: '这点困难罢了，不算什么。', en: 'It is only a small difficulty, nothing much.' },
    ],
    quiz: [
      { prompt: '我随便问问___。', options: ['罢了', '免得', '何况', '一旦'], answer: 0 },
      { prompt: '他只是累了罢了，___是生病。', options: ['不是', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-buzhiyu', h: 6, b: 6, pattern: ['不至于'], title: '不至于', titleEn: '不至于 — not so far as',
    explain: '“不至于” 说还没到那个程度。再忙也不至于不吃饭。',
    explainEn: '不至于 means it would not go as far as that. 不至于不吃饭 means “not so busy that you skip eating.”',
    examples: [
      { zh: '批评可以，不至于骂人。', en: 'Criticism is fine; it need not go as far as shouting at people.' },
      { zh: '一次失败不至于让人放弃。', en: 'One failure is not enough to make a person quit.' },
    ],
    quiz: [
      { prompt: '他生气，也___不说话。', options: ['不至于', '所以', '免得', '何况'], answer: 0 },
      { prompt: '这点雨不至于让比赛___。', options: ['停止', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-guran', h: 6, b: 7, pattern: ['固然'], title: '固然', titleEn: '固然 — granted that',
    explain: '“固然” 先承认一个事实，后面再说另一面。钱固然重要，健康更重要。',
    explainEn: '固然 concedes a point before the real emphasis. “Granted that…”',
    examples: [
      { zh: '这个办法固然慢，但是稳。', en: 'This method is slow, granted, but it is steady.' },
      { zh: '能力固然有差别，态度也不能差。', en: 'Ability differs, yes, but attitude cannot be careless either.' },
    ],
    quiz: [
      { prompt: '经验___重要，方法也对。', options: ['固然', '不至于', '所以', '免得'], answer: 0 },
      { prompt: '价格固然高，质量___好。', options: ['也', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-tangruo', h: 6, b: 8, pattern: ['倘若'], title: '倘若', titleEn: '倘若 — if (formal)',
    explain: '“倘若” 是比较书面的 “如果”。倘若没有准备，现场就会乱。',
    explainEn: '倘若 is a written “if.” 倘若没有准备 means “if there is no preparation.”',
    examples: [
      { zh: '倘若明天有空，我去看你。', en: 'If I am free tomorrow, I will visit you.' },
      { zh: '倘若只看结果，过程里的问题就被盖住了。', en: 'If you look only at the result, problems in the process get covered up.' },
    ],
    quiz: [
      { prompt: '___你不同意，我们可以再谈。', options: ['倘若', '固然', '所以', '何况'], answer: 0 },
      { prompt: '倘若迟到，请先___一声。', options: ['说', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-jibian', h: 6, b: 8, pattern: ['即便'], title: '即便', titleEn: '即便 — even if (formal)',
    explain: '“即便” 接近 “即使”，更书面。即便失败，这次尝试也有价值。',
    explainEn: '即便 means “even if” in a more formal tone.',
    examples: [
      { zh: '即便大家都走了，他还在看材料。', en: 'Even if everyone has left, he is still reading the materials.' },
      { zh: '即便现在开始，时间也不多。', en: 'Even if we start now, there is not much time.' },
    ],
    quiz: [
      { prompt: '___很难，也不要停。', options: ['即便', '倘若', '所以', '免得'], answer: 0 },
      { prompt: '即便赢了，___不能大意。', options: ['也', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-ningyuan', h: 6, b: 8, pattern: ['宁愿'], title: '宁愿', titleEn: '宁愿 — would rather',
    explain: '“宁愿” 和 “宁可” 一样，选择的语气更重。我宁愿少说，也不要说错。',
    explainEn: '宁愿 is a stronger “would rather.” 宁愿少说 means “I would rather say less.”',
    examples: [
      { zh: '她宁愿加班，也要把报告写完。', en: 'She would rather work late than leave the report unfinished.' },
      { zh: '我宁愿听不同的意见。', en: 'I would rather hear a different opinion.' },
    ],
    quiz: [
      { prompt: '他___自己承担。', options: ['宁愿', '即便', '倘若', '所以'], answer: 0 },
      { prompt: '宁愿慢，也不要___。', options: ['错', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-jiashi', h: 6, b: 8, pattern: ['假使'], title: '假使', titleEn: '假使 — supposing',
    explain: '“假使” 提出一个假设。假使时间够，我们可以做得更细。',
    explainEn: '假使 sets up a supposition, like “suppose that.”',
    examples: [
      { zh: '假使你是负责人，你会怎么决定？', en: 'Suppose you were in charge. How would you decide?' },
      { zh: '假使数据有误，结论就要重做。', en: 'If the data are wrong, the conclusion has to be redone.' },
    ],
    quiz: [
      { prompt: '___重来一次，我还会这样选。', options: ['假使', '宁愿', '所以', '何况'], answer: 0 },
      { prompt: '假使没人反对，计划___通过。', options: ['就', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-zongran', h: 6, b: 9, pattern: ['纵然'], title: '纵然', titleEn: '纵然 — even though (literary)',
    explain: '“纵然” 是书面的让步，接近 “即使”。纵然有不同意见，决定已经做出。',
    explainEn: '纵然 is a literary “even though” or “even if.”',
    examples: [
      { zh: '纵然路远，他也要去一趟。', en: 'Even though the road is long, he will make the trip.' },
      { zh: '纵然不能全部解决，也可以先解决最急的。', en: 'Even if it cannot all be solved, the most urgent part can be done first.' },
    ],
    quiz: [
      { prompt: '___困难很多，工作还在继续。', options: ['纵然', '假使', '所以', '免得'], answer: 0 },
      { prompt: '纵然不同意，他也___听完。', options: ['会', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-weimian', h: 6, b: 9, pattern: ['未免'], title: '未免', titleEn: '未免 — rather too',
    explain: '这样说未免太绝对。对孩子这样要求，未免太高。',
    explainEn: '未免 means “rather” or “a bit too,” often disagreeing with how far someone went.',
    examples: [
      { zh: '一次没答好，未免不能说明全部。', en: 'One poor answer can hardly stand for the whole thing.' },
      { zh: '对孩子这样要求，未免太高。', en: 'Expecting that of a child is rather too much.' },
    ],
    quiz: [
      { prompt: '这个结论___太快。', options: ['未免', '所以', '假使', '固然'], answer: 0 },
      { prompt: '只看一天，未免___片面。', options: ['有点', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-jianyu', h: 6, b: 9, pattern: ['鉴于'], title: '鉴于', titleEn: '鉴于 — in view of',
    explain: '鉴于时间不够，会议改到下周。鉴于天气不好，活动改在室内。',
    explainEn: '鉴于 means “in view of” or “given,” and introduces the basis for a decision.',
    examples: [
      { zh: '鉴于天气不好，活动改在室内。', en: 'Given the weather, the event moved indoors.' },
      { zh: '鉴于双方的意见，我们先做一个小范围的试验。', en: 'In view of both sides, we will run a small trial first.' },
    ],
    quiz: [
      { prompt: '___人数太多，报名提前结束。', options: ['鉴于', '未免', '所以', '固然'], answer: 0 },
      { prompt: '鉴于成本，方案需要___。', options: ['修改', '吗', '的', '和'], answer: 0 },
    ],
  },
  {
    id: 'g-hendebude', h: 6, b: 9, pattern: ['恨不得'], title: '恨不得', titleEn: '恨不得 — itching to',
    explain: '“恨不得” 说一个很强、常常做不到的愿望。忙完以后，我恨不得马上睡觉。',
    explainEn: '恨不得 means you wish you could do something immediately, often beyond what is possible.',
    examples: [
      { zh: '他恨不得一天把一年的书看完。', en: 'He wishes he could finish a year’s reading in a day.' },
      { zh: '听到好消息，她恨不得立刻告诉所有人。', en: 'Hearing the good news, she could hardly wait to tell everyone.' },
    ],
    quiz: [
      { prompt: '我___现在就出发。', options: ['恨不得', '鉴于', '未免', '所以'], answer: 0 },
      { prompt: '他恨不得把问题马上___。', options: ['解决', '吗', '的', '和'], answer: 0 },
    ],
  },
];

export function grammarLevel(point: GrammarPoint, track: 'classic' | 'hsk3'): number {
  return track === 'classic' ? point.h : point.b;
}

export function grammarFor(track: 'classic' | 'hsk3', level: number): GrammarPoint[] {
  return GRAMMAR.filter((point) => grammarLevel(point, track) === level && (track === 'classic' ? point.h > 0 : point.b > 0));
}
