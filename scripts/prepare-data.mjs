/**
 * Build the offline lexicon and sentence bank.
 *
 * Inputs (gitignored, under data/raw):
 *   hsk-complete.min.json  — drkameleon/complete-hsk-vocabulary (MIT)
 *   cedict_ts.u8           — CC-CEDICT (CC BY-SA 4.0)
 *   cmn.txt                — Tatoeba cmn–eng pairs via manythings.org (CC BY 2.0)
 *
 * Outputs:
 *   src/data/lexicon.json
 *   src/data/sentences.json
 *   src/data/meta.json
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const raw = resolve(root, 'data/raw');
const outDir = resolve(root, 'src/data');
mkdirSync(outDir, { recursive: true });

const PUNCT = new Set(
  ' \t\n\r，。！？、；：,.!?;:""“”‘’「」『』（）()《》…—～~·・-—'.split(''),
);

function isPunct(ch) {
  return PUNCT.has(ch);
}

function normPy(n) {
  return String(n || '')
    .toLowerCase()
    .replace(/u:/g, 'v')
    .replace(/ü/g, 'v')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanDef(rawDef) {
  return String(rawDef || '')
    .split('/')
    .map((part) =>
      part
        .replace(/\[[^\]]*\]/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(Boolean)
    .slice(0, 4)
    .join('; ')
    .slice(0, 220);
}

function levelNum(list, prefix) {
  let best = 0;
  for (const code of list || []) {
    if (typeof code === 'string' && code.startsWith(prefix)) {
      const n = Number(code.slice(prefix.length));
      if (n && (best === 0 || n < best)) best = n;
    }
  }
  return best;
}

function parseCedict(text) {
  const map = new Map();
  const tVotes = new Map();
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/\s*$/);
    if (!m) continue;
    const trad = m[1];
    const simp = m[2];
    const py = m[3];
    const meaning = cleanDef(m[4]);
    const key = `${simp}|${normPy(py)}`;
    const prev = map.get(key);
    if (prev) {
      if (meaning && !prev.m.includes(meaning.slice(0, 24))) {
        prev.m = `${prev.m}; ${meaning}`.slice(0, 220);
      }
    } else {
      map.set(key, { t: trad, s: simp, n: normPy(py), pyRaw: py, m: meaning });
    }
    if ([...trad].length === [...simp].length) {
      const ts = [...trad];
      const ss = [...simp];
      for (let i = 0; i < ts.length; i++) {
        if (ts[i] === ss[i]) continue;
        let bucket = tVotes.get(ts[i]);
        if (!bucket) {
          bucket = new Map();
          tVotes.set(ts[i], bucket);
        }
        bucket.set(ss[i], (bucket.get(ss[i]) || 0) + 1);
      }
    }
  }
  const t2s = new Map();
  for (const [tradChar, bucket] of tVotes) {
    let best = '';
    let bestN = 0;
    for (const [simpChar, n] of bucket) {
      if (n > bestN) {
        best = simpChar;
        bestN = n;
      }
    }
    if (best) t2s.set(tradChar, best);
  }
  return { map, t2s };
}

function formScore(pinyin, meaning, index) {
  let score = index;
  const m = meaning || '';
  if (/^surname\b/i.test(m) || /^[A-ZĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙ]/.test(pinyin)) score += 1000;
  if (/variant of|euphemistic|Belgium|\babbr\./i.test(m)) score += 500;
  if (/^(comma|unofficial|old variant)\b/i.test(m)) score += 400;
  if (/^\(bound form\)/i.test(m)) score += 80;
  return score;
}

const PREFER_READING = {
  读: 'du2',
  行: 'xing2',
  长: 'chang2',
  重: 'zhong4',
  发: 'fa1',
  乐: 'le4',
  干: 'gan4',
  只: 'zhi3',
  看: 'kan4',
  会: 'hui4',
  少: 'shao3',
  好: 'hao3',
  得: 'de2',
  还: 'hai2',
  教: 'jiao1',
  为: 'wei4',
  着: 'zhe5',
  过: 'guo4',
  地: 'di4',
  的: 'de5',
  了: 'le5',
  比: 'bi3',
  也: 'ye3',
  高: 'gao1',
  吗: 'ma5',
  吧: 'ba5',
  啊: 'a5',
  东西: 'dong1xi5',
  多少: 'duo1shao5',
  个: 'ge4',
  喝: 'he1',
  和: 'he2',
  几: 'ji3',
  上: 'shang4',
  听: 'ting1',
  便宜: 'pian2yi5',
  别: 'bie2',
  告诉: 'gao4su5',
  累: 'lei4',
  离: 'li2',
  妻子: 'qi1zi5',
  地方: 'di4fang5',
  更: 'geng4',
  故事: 'gu4shi5',
  胖: 'pang4',
  骑: 'qi2',
  万: 'wan4',
  说: 'shuo1',
};

const FORCE_H = {
  '说|shuo1': 1,
  '他们|ta1men5': 2,
  '她们|ta1men5': 2,
  '一点儿|yi1dian3r5': 2,
  '电话|dian4hua4': 2,
  '饭|fan4': 1,
  '哪儿|na3r5': 1,
  '病|bing4': 2,
};

function vulgarOnly(meaning) {
  const parts = meaning.split(';').map((part) => part.trim()).filter(Boolean);
  return parts.length > 0 && parts.every((part) => /penis|vagina|\bfuck\b|屄|屌/i.test(part));
}

function tidyMeaning(meaning) {
  const parts = meaning
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);
  const bad = /^(Belgium|Belgian|surname\b|euphemistic|variant of|old variant|unofficial|abbr\.)/i;
  const good = parts.filter((part) => !bad.test(part));
  const rest = parts.filter((part) => bad.test(part));
  return [...good, ...rest].slice(0, 4).join('; ').slice(0, 220);
}

function studyableMeaning(meaning) {
  const parts = meaning.split(';').map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return false;
  return parts.some((p) => !/^(surname\b|variant of\b|old variant\b|archaic variant\b)/i.test(p));
}

const hsk = JSON.parse(readFileSync(resolve(raw, 'hsk-complete.min.json'), 'utf8'));
const cedictText = readFileSync(resolve(raw, 'cedict_ts.u8'), 'utf8');
const { map: cedict, t2s } = parseCedict(cedictText);

const byId = new Map();

function addWord(entry) {
  const prev = byId.get(entry.id);
  if (!prev) {
    byId.set(entry.id, entry);
    return;
  }
  const prevNamed = /^[A-ZĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙ]/.test(prev.p);
  const nextNamed = /^[A-ZĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙ]/.test(entry.p);
  if (prevNamed && !nextNamed) {
    prev.p = entry.p;
    prev.m = entry.m;
    prev.pref = Math.min(prev.pref, entry.pref);
  } else if (entry.m && !prev.m.includes(entry.m.slice(0, 18))) {
    prev.m = `${prev.m}; ${entry.m}`.slice(0, 280);
  }
  if (!prev.pos && entry.pos) prev.pos = entry.pos;
  if (entry.h && (!prev.h || entry.h < prev.h)) prev.h = entry.h;
  if (entry.b && (!prev.b || entry.b < prev.b)) prev.b = entry.b;
  if (entry.q && entry.q < prev.q) prev.q = entry.q;
  if (entry.pref < prev.pref) prev.pref = entry.pref;
}

for (const entry of hsk) {
  const h = levelNum(entry.l, 'o');
  const b = levelNum(entry.l, 'n');
  const pos = Array.isArray(entry.p) ? entry.p.slice(0, 2).join(',') : '';
  const forms = Array.isArray(entry.f) ? entry.f : [];
  forms.forEach((form, index) => {
    const pinyin = form?.i?.y || '';
    const numeric = normPy(form?.i?.n || '');
    const simp = entry.s;
    if (!simp || !pinyin || !numeric) return;
    const key = `${simp}|${numeric}`;
    const fromCedict = cedict.get(key);
    const meanings = Array.isArray(form.m) ? form.m.filter(Boolean) : [];
    const hskMeaning = meanings
      .map((m) => String(m).replace(/\s+/g, ' ').trim())
      .slice(0, 3)
      .join('; ')
      .slice(0, 220);
    const meaning = fromCedict?.m || hskMeaning;
    if (!meaning || !studyableMeaning(meaning) || vulgarOnly(meaning)) return;
    const id = `${simp}~${numeric.replace(/\s+/g, '_')}`;
    addWord({
      id,
      s: simp,
      t: fromCedict?.t || form.t || simp,
      p: pinyin,
      n: numeric,
      m: meaning,
      h,
      b,
      q: Number(entry.q) || 100000,
      pos,
      pref: formScore(pinyin, meaning, index),
    });
  });
}

function ensurePhrase(simp, h, b, q) {
  const hits = [...cedict.values()].filter((row) => row.s === simp);
  if (!hits.length) {
    console.warn('missing cedict phrase', simp);
    return;
  }
  const row = hits[0];
  const id = `${row.s}~${row.n.replace(/\s+/g, '_')}`;
  if (byId.has(id)) {
    const prev = byId.get(id);
    if (!prev.h) prev.h = h;
    if (!prev.b) prev.b = b;
    prev.q = Math.min(prev.q, q);
    return;
  }
  const syllables = row.pyRaw.split(/\s+/).map((syl) => numericSyllableToMark(syl)).join(' ');
  addWord({
    id,
    s: row.s,
    t: row.t,
    p: syllables,
    n: row.n,
    m: row.m,
    h,
    b,
    q,
    pos: 'l',
    pref: 0,
  });
}

function numericSyllableToMark(syl) {
  const m = String(syl).toLowerCase().match(/^([a-züv:]+)([1-5])$/i);
  if (!m) return syl;
  let body = m[1].replace(/u:/g, 'ü').replace(/v/g, 'ü');
  const tone = Number(m[2]);
  if (tone === 5) return body;
  const marks = {
    a: 'āáǎà',
    e: 'ēéěè',
    i: 'īíǐì',
    o: 'ōóǒò',
    u: 'ūúǔù',
    ü: 'ǖǘǚǜ',
  };
  const chars = [...body];
  let idx = chars.findIndex((ch) => ch === 'a' || ch === 'e');
  if (idx < 0 && body.includes('ou')) idx = chars.indexOf('o');
  if (idx < 0) {
    for (let i = chars.length - 1; i >= 0; i--) {
      if (marks[chars[i]]) {
        idx = i;
        break;
      }
    }
  }
  if (idx < 0 || !marks[chars[idx]]) return body;
  chars[idx] = marks[chars[idx]][tone - 1];
  return chars.join('');
}

ensurePhrase('你好', 1, 1, 30);
ensurePhrase('早上好', 1, 1, 800);
ensurePhrase('您好', 1, 1, 400);

for (const w of byId.values()) {
  const key = `${w.s}|${w.n.replace(/\s+/g, '')}`;
  if (!w.h && FORCE_H[key]) w.h = FORCE_H[key];
}

const bySimpAll = new Map();
for (const w of byId.values()) {
  const list = bySimpAll.get(w.s) || [];
  list.push(w);
  bySimpAll.set(w.s, list);
}
for (const list of bySimpAll.values()) {
  const preferred = PREFER_READING[list[0]?.s];
  if (preferred) {
    for (const w of list) {
      if (w.n.replace(/\s+/g, '') === preferred) w.pref -= 1000;
    }
  }
  list.sort((a, b) => a.pref - b.pref || a.q - b.q || a.n.localeCompare(b.n));
  list.forEach((w, i) => {
    w.alt = i === 0 ? 0 : 1;
  });
}

const words = [...byId.values()].sort((a, b) => a.s.localeCompare(b.s, 'zh') || a.n.localeCompare(b.n));

const bySimp = new Map();
let maxLen = 1;
const simplifiedChars = new Set();
for (const w of words) {
  maxLen = Math.max(maxLen, [...w.s].length);
  for (const ch of w.s) simplifiedChars.add(ch);
  const list = bySimp.get(w.s) || [];
  list.push(w);
  bySimp.set(w.s, list);
}
for (const list of bySimp.values()) {
  list.sort((a, b) => a.pref - b.pref || a.q - b.q);
}

function prefer(list) {
  return list[0];
}

function segment(text) {
  const parts = [];
  const chars = [...text];
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    if (isPunct(ch)) {
      parts.push({ text: ch, word: null });
      i++;
      continue;
    }
    let found = null;
    let foundLen = 0;
    const upper = Math.min(maxLen, chars.length - i);
    for (let len = upper; len >= 1; len--) {
      const slice = chars.slice(i, i + len).join('');
      const hits = bySimp.get(slice);
      if (!hits || !hits.length) continue;
      const classic = hits.filter((word) => word.h > 0);
      if (classic.length) {
        found = classic[0];
        foundLen = len;
        break;
      }
      if (len === 1) {
        found = hits[0];
        foundLen = 1;
        break;
      }
    }
    if (found) {
      parts.push({ text: found.s, word: found });
      i += foundLen;
    } else {
      parts.push({ text: ch, word: null });
      i++;
    }
  }
  return parts;
}

function convertTraditional(text) {
  return [...text]
    .map((ch) => {
      if (simplifiedChars.has(ch)) return ch;
      return t2s.get(ch) || ch;
    })
    .join('');
}

function coverage(text) {
  const parts = segment(text);
  const tiles = [];
  let han = 0;
  let known = 0;
  for (const part of parts) {
    if (isPunct(part.text)) continue;
    const n = [...part.text].length;
    han += n;
    if (part.word) {
      known += n;
      tiles.push(part.word);
    }
  }
  return { ok: han > 0 && known === han, han, tiles };
}

const originals = [
  { h: 1, zh: '你好！', en: 'Hello!' },
  { h: 1, zh: '我爱学习汉语。', en: 'I love studying Chinese.' },
  { h: 1, zh: '今天天气很好。', en: 'The weather is nice today.' },
  { h: 1, zh: '你喜欢喝茶吗？', en: 'Do you like drinking tea?' },
  { h: 1, zh: '我们中午吃米饭。', en: 'We eat rice at noon.' },
  { h: 1, zh: '她是我的老师。', en: 'She is my teacher.' },
  { h: 1, zh: '今天下雨了。', en: 'It is raining today.' },
  { h: 1, zh: '我想去北京。', en: 'I want to go to Beijing.' },
  { h: 1, zh: '爸爸在家看电视。', en: 'Dad is at home watching TV.' },
  { h: 1, zh: '你叫什么名字？', en: 'What is your name?' },
  { h: 1, zh: '我不会说汉语。', en: 'I cannot speak Chinese.' },
  { h: 1, zh: '天气太冷了。', en: 'The weather is too cold.' },
  { h: 1, zh: '我喜欢看电影。', en: 'I like watching movies.' },
  { h: 1, zh: '他有三个女儿。', en: 'He has three daughters.' },
  { h: 1, zh: '我们坐出租车去饭馆。', en: 'We take a taxi to the restaurant.' },
  { h: 1, zh: '现在几点？', en: 'What time is it now?' },
  { h: 1, zh: '谢谢你！', en: 'Thank you!' },
  { h: 1, zh: '同学在商店买水果。', en: 'A classmate is buying fruit at the shop.' },
  { h: 1, zh: '明天是星期六吗？', en: 'Is tomorrow Saturday?' },
  { h: 1, zh: '医生在医院工作。', en: 'The doctor works at the hospital.' },
  { h: 2, zh: '我每天早上读一会儿汉语。', en: 'I read Chinese for a while every morning.' },
  { h: 2, zh: '你什么时候来我家？', en: 'When are you coming to my place?' },
  { h: 2, zh: '外面正在下雨，我们坐公共汽车吧。', en: 'It is raining outside. Let us take the bus.' },
  { h: 2, zh: '这件衣服有一点儿贵。', en: 'This piece of clothing is a bit expensive.' },
  { h: 2, zh: '我准备明天去机场。', en: 'I plan to go to the airport tomorrow.' },
  { h: 2, zh: '她唱歌很好听。', en: 'She sings beautifully.' },
  { h: 2, zh: '请你慢慢说。', en: 'Please speak slowly.' },
  { h: 2, zh: '我哥哥比我高。', en: 'My older brother is taller than me.' },
  { h: 3, zh: '我打算周末去公园跑步。', en: 'I plan to go running in the park this weekend.' },
  { h: 3, zh: '虽然很忙，我还是想练习汉语。', en: 'Even though I am busy, I still want to practice Chinese.' },
  { h: 3, zh: '请把窗户打开，房间里太热了。', en: 'Please open the window. It is too hot in the room.' },
  { h: 3, zh: '他已经习惯了纽约的生活。', en: 'He is already used to life in New York.' },
  { h: 3, zh: '我们先吃饭，然后去看电影。', en: 'We will eat first, and then go see a movie.' },
  { h: 3, zh: '这个问题我不太明白。', en: 'I do not really understand this question.' },
  { h: 4, zh: '我一般坐地铁去上班，路上会听中文。', en: 'I usually take the subway to work and listen to Chinese on the way.' },
  { h: 4, zh: '如果你有空，我们一起复习今天的生词吧。', en: 'If you are free, let us review today\'s new words together.' },
  { h: 4, zh: '他对北京的秋天特别感兴趣。', en: 'He is especially interested in Beijing\'s autumn.' },
  { h: 4, zh: '不管天气怎么样，她都坚持运动。', en: 'No matter the weather, she keeps exercising.' },
  { h: 5, zh: '在纽约生活既方便又忙碌。', en: 'Life in New York is both convenient and busy.' },
  { h: 5, zh: '我逐渐能听懂同事之间的日常对话。', en: 'I can gradually understand everyday conversations between coworkers.' },
  { h: 5, zh: '这篇短文的大意我看懂了，可是有几个词还不熟悉。', en: 'I understood the gist of this short text, but a few words are still unfamiliar.' },
  { h: 6, zh: '阅读汉字的时候，上下文往往比单个词的字典义更重要。', en: 'When reading Chinese characters, context is often more important than a single dictionary sense.' },
  { h: 6, zh: '他把一个复杂的想法用很平实的句子说清楚了。', en: 'He explained a complicated idea clearly with very plain sentences.' },
];

function sentenceRecord(zh, en, source) {
  let text = zh.trim();
  let cov = coverage(text);
  if (!cov.ok) {
    const converted = convertTraditional(text);
    const again = coverage(converted);
    if (!again.ok) return null;
    text = converted;
    cov = again;
  }
  if (cov.han < 2 || cov.han > 28) return null;
  const tiles = cov.tiles;
  const allH = tiles.every((w) => w.h > 0);
  const h = allH ? Math.max(...tiles.map((w) => w.h)) : 0;
  const bandOf = (w) => w.b || w.h || 0;
  const allB = tiles.every((w) => bandOf(w) > 0);
  const b = allB ? Math.max(...tiles.map(bandOf)) : 0;
  if (!h && !b) return null;
  const py = tiles.map((w) => w.p).join(' ');
  return {
    zh: text,
    en: en.trim(),
    py,
    tiles: tiles.map((w) => w.s),
    h,
    b,
    src: source,
  };
}

const sentences = [];
const seenZh = new Set();

function pushSentence(zh, en, source) {
  const key = [...zh].filter((ch) => !isPunct(ch)).join('');
  if (!key || seenZh.has(key)) return false;
  const rec = sentenceRecord(zh, en, source);
  if (!rec) return false;
  seenZh.add(key);
  sentences.push(rec);
  return true;
}

let originalKept = 0;
for (const row of originals) {
  const before = sentences.length;
  pushSentence(row.zh, row.en, 'original');
  if (sentences.length > before) {
    sentences[sentences.length - 1].h = sentences[sentences.length - 1].h || row.h;
    originalKept++;
  } else {
    console.warn('dropped original:', row.zh);
  }
}

const banned =
  /\b(fuck|fucking|shit|porn|porno|sex|sexy|rape|rapist|slut|nigger|cunt|dick|penis|vagina|orgasm|naked|nude)\b/i;

const cmn = readFileSync(resolve(raw, 'cmn.txt'), 'utf8');
const perLevel = new Map();
for (const line of cmn.split('\n')) {
  if (!line.trim()) continue;
  const tab = line.indexOf('\t');
  if (tab < 0) continue;
  const en = line.slice(0, tab).trim();
  const rest = line.slice(tab + 1);
  const tab2 = rest.indexOf('\t');
  const zh = (tab2 < 0 ? rest : rest.slice(0, tab2)).trim();
  if (!en || !zh) continue;
  if (en.length < 2 || en.length > 120) continue;
  if (banned.test(en) || banned.test(zh)) continue;
  if (/\bTom\b|\bMary\b|\bJohn\b/.test(en)) continue;
  if (/[A-Za-z0-9]/.test(zh)) continue;
  if (/[<>{}]/.test(en)) continue;
  const rec = sentenceRecord(zh, en, 'tatoeba');
  if (!rec) continue;
  const bucketKey = rec.h || (rec.b ? 10 + rec.b : 0);
  if (!bucketKey) continue;
  const list = perLevel.get(bucketKey) || [];
  if (list.length >= 160) continue;
  const key = [...rec.zh].filter((ch) => !isPunct(ch)).join('');
  if (seenZh.has(key)) continue;
  seenZh.add(key);
  list.push(rec);
  perLevel.set(bucketKey, list);
}

for (const list of perLevel.values()) {
  list.sort((a, b) => a.tiles.length - b.tiles.length || [...a.zh].length - [...b.zh].length);
  for (const rec of list) sentences.push(rec);
}

sentences.forEach((s, i) => {
  s.id = `s${String(i + 1).padStart(4, '0')}`;
});

const lexiconOut = words.map(({ pref, ...w }) => ({ ...w, m: tidyMeaning(w.m) }));
writeFileSync(resolve(outDir, 'lexicon.json'), JSON.stringify(lexiconOut));
writeFileSync(resolve(outDir, 'sentences.json'), JSON.stringify(sentences));

const meta = {
  generated: new Date().toISOString().slice(0, 10),
  words: lexiconOut.length,
  sentences: sentences.length,
  originalKept,
  classic: Object.fromEntries(
    [1, 2, 3, 4, 5, 6].map((n) => [n, lexiconOut.filter((w) => w.h === n).length]),
  ),
  hsk3: Object.fromEntries(
    [1, 2, 3, 4, 5, 6, 7].map((n) => [n, lexiconOut.filter((w) => w.b === n).length]),
  ),
  sentenceLevels: Object.fromEntries(
    [1, 2, 3, 4, 5, 6].map((n) => [n, sentences.filter((s) => s.h === n).length]),
  ),
};
writeFileSync(resolve(outDir, 'meta.json'), JSON.stringify(meta, null, 2));
console.log(JSON.stringify(meta, null, 2));
