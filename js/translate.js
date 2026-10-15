import { sentences, analyze } from './korean.js';
import { readMood, mainMood } from './mood.js';
import { hash, rng } from './util.js';
import { chiikawa, hachiware, usagi } from './speakers/trio.js';
import { shisa, kurimanju, rakko, momonga } from './speakers/others.js';

export const CHARACTERS = [
  { id: 'chiikawa', name: '치이카와', layout: 'lead', panel: '#f4b5c5', ink: '#e98aa1', intro: '와…! (뭔가 써 달라는 눈빛)', speak: chiikawa },
  { id: 'hachiware', name: '하치와레', layout: '', panel: '#9fc0cf', ink: '#5f8ea6', intro: '뭐야 뭐야? 여기에 쓰면 내가 말해 줄겟!', speak: hachiware },
  { id: 'usagi', name: '우사기', layout: '', panel: '#f1d98a', ink: '#d9b442', intro: '야하!', speak: usagi },
  { id: 'shisa', name: '시사', layout: 'wide', panel: '#f5b683', ink: '#e48a45', intro: '어서 오세요!', speak: shisa },
  { id: 'kurimanju', name: '쿠리만쥬', layout: 'wide', panel: '#d2a77f', ink: '#a8754a', intro: '하아—ㅅ', speak: kurimanju },
  { id: 'rakko', name: '랏코', layout: 'wide', panel: '#a7d4c5', ink: '#5fae97', intro: '…무슨 일이지.', speak: rakko },
  { id: 'momonga', name: '모몽가', layout: 'wide', panel: '#c9bbe8', ink: '#9a85cf', intro: '나 귀엽지? 칭찬해 줘!', speak: momonga },
];

export const EXAMPLES = ['오늘 너무 배고파', '같이 라면 먹으러 갈래?', '시험 망쳤어…', '이거 진짜 맛있다!', '나 칭찬해 줘'];

export function parse(text) {
  return sentences(text).map((s) => {
    const a = analyze(s.body, s.punct);
    const tags = readMood(s.body + (a.tail || ''), s.punct);
    return { ...s, a, tags, mood: mainMood(tags) };
  });
}

export function translate(text, id, roll = 0) {
  const c = CHARACTERS.find((x) => x.id === id);
  const list = parse(text);
  if (!list.length) return c.intro;
  const rand = rng(hash(`${id}|${roll}|${text}`));
  return c.speak(list, rand).replace(/\s+/g, ' ').trim();
}
