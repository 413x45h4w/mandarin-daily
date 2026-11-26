import type { Passage } from '../types';

/** Original graded readings. Every word is checked against the bundled lexicon in tests. */
export const PASSAGES: Passage[] = [
  {
    id: 'p1a',
    h: 1,
    b: 1,
    title: '我的一天',
    paragraphs: ['今天我很高兴。', '我去学校学习汉语。', '中午我吃米饭。', '下午我喝茶，看书。'],
    questions: [
      { prompt: 'Where do I go?', options: ['School', 'The hospital', 'A shop'], answer: 0 },
      { prompt: 'What do I eat at noon?', options: ['Fruit', 'Rice', 'Tea'], answer: 1 },
    ],
  },
  {
    id: 'p1b',
    h: 1,
    b: 1,
    title: '在家',
    paragraphs: ['爸爸在家看电视。', '妈妈喝茶。', '我看书，写字。', '我们都很高兴。'],
    questions: [
      { prompt: 'What is Dad doing?', options: ['Watching TV', 'Sleeping', 'Cooking'], answer: 0 },
      { prompt: 'How does everyone feel?', options: ['Cold', 'Happy', 'Busy'], answer: 1 },
    ],
  },
  {
    id: 'p2a',
    h: 2,
    b: 2,
    title: '星期六',
    paragraphs: ['昨天天气很好。', '我和朋友去商店买东西。', '那件衣服有一点儿贵。', '晚上我们在家看电视。'],
    questions: [
      { prompt: 'How was the weather?', options: ['Very good', 'Rainy', 'Too cold'], answer: 0 },
      { prompt: 'What was a bit expensive?', options: ['The clothes', 'The tea', 'The taxi'], answer: 0 },
    ],
  },
  {
    id: 'p2b',
    h: 2,
    b: 2,
    title: '哥哥',
    paragraphs: ['我早上读汉语。', '哥哥比我高。', '他也学习汉语。', '我们准备明天去北京。'],
    questions: [
      { prompt: 'Who is taller?', options: ['Older brother', 'The teacher', 'Mom'], answer: 0 },
      { prompt: 'Where are they preparing to go?', options: ['Beijing', 'A hospital', 'The shop'], answer: 0 },
    ],
  },
  {
    id: 'p3a',
    h: 3,
    b: 3,
    title: '周末的计划',
    paragraphs: ['我打算去公园跑步。', '虽然很忙，我还是想学习汉语。', '我们先吃米饭，然后看电影。', '这个问题我不明白。'],
    questions: [
      { prompt: 'What is the plan?', options: ['Run in the park', 'Stay in bed', 'Go to the bank'], answer: 0 },
      { prompt: 'What happens after eating?', options: ['A movie', 'A test', 'A meeting'], answer: 0 },
    ],
  },
  {
    id: 'p3b',
    h: 3,
    b: 3,
    title: '新朋友',
    paragraphs: ['我认识一个新朋友。', '她在医院工作，是医生。', '昨天晚上我们一起吃饭。', '她告诉我一个故事。'],
    questions: [
      { prompt: 'What does the new friend do?', options: ['She is a doctor', 'She is a teacher', 'She works in a shop'], answer: 0 },
      { prompt: 'What did she tell?', options: ['A story', 'A phone number', 'The news about a test'], answer: 0 },
    ],
  },
  {
    id: 'p4a',
    h: 4,
    b: 4,
    title: '去上班',
    paragraphs: ['我坐地铁去上班。', '因为下雨，所以我很忙。', '同事告诉我一个新闻。', '我们一起复习汉语。'],
    questions: [
      { prompt: 'How do I get to work?', options: ['By subway', 'By plane', 'On a bike'], answer: 0 },
      { prompt: 'Why am I busy?', options: ['Because it is raining', 'Because I am ill', 'Because the shop is closed'], answer: 0 },
    ],
  },
  {
    id: 'p4b',
    h: 4,
    b: 4,
    title: '一个故事',
    paragraphs: ['这个故事很有意思。', '他用简单的句子告诉我。', '我读得很慢，但是我明白了。', '我想再读一遍。'],
    questions: [
      { prompt: 'How did he tell the story?', options: ['With simple sentences', 'With a song', 'He did not speak'], answer: 0 },
      { prompt: 'How did the reader do?', options: ['Read slowly and understood', 'Understood nothing', 'Refused to read'], answer: 0 },
    ],
  },
  {
    id: 'p5a',
    h: 5,
    b: 5,
    title: '城市生活',
    paragraphs: ['城市生活很忙，也很方便。', '坐地铁去公司要一个小时。', '同事和我一起练习汉语。', '我希望自己的汉语很好。'],
    questions: [
      { prompt: 'How is city life described?', options: ['Busy and convenient', 'Quiet and cheap', 'Boring and slow'], answer: 0 },
      { prompt: 'What does the narrator hope?', options: ['That their Chinese is good', 'To leave the city', 'To stop studying'], answer: 0 },
    ],
  },
  {
    id: 'p5b',
    h: 5,
    b: 5,
    title: '读短文',
    paragraphs: ['我看懂了这个故事的意思。', '有几个字我不认识。', '我把这些字写在书上。', '晚上我再复习一次。'],
    questions: [
      { prompt: 'What did the reader understand?', options: ['The meaning of the story', 'Nothing at all', 'Only the title'], answer: 0 },
      { prompt: 'What did they do in the evening?', options: ['Reviewed once more', 'Stopped studying', 'Went to work'], answer: 0 },
    ],
  },
  {
    id: 'p6a',
    h: 6,
    b: 6,
    title: '怎么读',
    paragraphs: ['阅读的时候，句子很重要。', '我先看句子的意思，再看不认识的字。', '有的句子不能直接翻译。', '我读得很慢，但是理解得更清楚。'],
    questions: [
      { prompt: 'What does the writer look at first?', options: ['The meaning of the sentence', 'Only the dictionary', 'The pictures'], answer: 0 },
      { prompt: 'What is true of some phrases?', options: ['They cannot be translated directly', 'They are always names', 'They have no meaning'], answer: 0 },
    ],
  },
  {
    id: 'p6b',
    h: 6,
    b: 6,
    title: '说清楚',
    paragraphs: ['他把一个复杂的意思说得很清楚。', '句子不长，但是我明白了。', '听的人很快就明白了。', '这些句子值得学习。'],
    questions: [
      { prompt: 'How did he explain the idea?', options: ['Clearly, in short sentences', 'With difficult terms only', 'He refused to explain'], answer: 0 },
      { prompt: 'How did the listeners do?', options: ['They understood quickly', 'They left immediately', 'They disagreed with every word'], answer: 0 },
    ],
  },
];
