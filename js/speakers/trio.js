// 치이카와 · 하치와레 · 우사기
// 근거: 나무위키 치이카와/가르마/토끼(먼작귀), ちいかわ 원작 대사 모음, 애니 회차 요약 (리서치 노트 참고)
import { split } from '../korean.js';
import { conj } from '../korean.js';
import { withPre, quoteForm, casualLast, clip, drawl, drawlClip, pickN, keyWord, stripJosa, echoHead, deformal, onceSet, invertIndex, SUPERIOR } from './common.js';

// ── 치이카와 ────────────────────────────────────────────
// 문장으로 말하지 않는다. 감탄사 + 들은 낱말 앞 1~2음절 따라 하기 (チャル… / スポ… / ソム…?)

const CHII = {
  happy: ['와아…!', '후!!', '와앗!!!', '와아이', '후훗', '와…!'],
  love: ['와아…', '후훗', '와…!', '후!!'],
  praise: ['와아…!', '후!!', '와앗!!!'],
  food: ['와아…', '후!!', '앙냠', '와아…!'],
  drink: ['와…', '후…', '에…?'],
  hungry: ['후…', '와아…', '우우…'],
  sad: ['와아……아……', '우우…', '아앙~', '후…', '아~아~'],
  scared: ['히익…!!', '와…와…', '싫어어—!!', '아앗!! 아앗!!'],
  angry: ['싫엇!!', '에엑', '읍', '이, 이얏…!'],
  dislike: ['싫어…', '엣…싫어…', '싫엇!!', '우우…'],
  no: ['싫어…', '싫엇!!', '엣…싫어…'],
  surprised: ['에에엣!!?', '엣', '앗', '와앗', '에!?'],
  tired: ['후우우…', '음냐리…', '후우…응…'],
  sleep: ['음냐리…', '후우…'],
  yes: ['응!!', '…응', '응'],
  ask: ['에…?', '음…?', '으음…', '저기…'],
  thanks: ['와아…', '…응!', '후훗'],
  sorry: ['저기…', '우…', '으음…'],
  greet: ['앗…!', '와아…!'],
  bye: ['…응!', '와…'],
  work: ['영차…', '읏차…', '영차… 영차…'],
  play: ['와아이!', '와앗!!', '후!!'],
  bang: ['와앗!', '앗!', '와…!'],
  plain: ['와…', '앗…', '…응', '후…'],
};

const CHII_ACT = {
  sad: '(훌쩍)',
  scared: '(덜덜)',
  yes: '(끄덕끄덕)',
  no: '(도리도리)',
  sorry: '(웅얼웅얼)',
  greet: '(손 흔들기)',
  bye: '(손 흔들기)',
  hungry: '(꼬르륵)',
  tired: '(꾸벅)',
  work: '(풀 뽑는 중)',
  angry: '(이 악물기)',
  dislike: '(도리도리)',
};

function chiiOne(s, rand) {
  const t = s.tags;
  let mood = s.mood;
  // 같이 먹자/놀자는 권유는 반가운 일
  if (t.has('ask') && (t.has('food') || t.has('play')) && !t.has('neg')) mood = 'happy';
  const parts = [];

  // 명사가 없으면 마지막 말(배고파 → 배고…)이라도 따라 한다
  const kw = keyWord(s.a) ?? (s.a.ok ? (mood !== 'plain' && s.a.word.length >= 2 ? s.a.word : null) : stripJosa(s.a.word));
  const echo = kw && kw.length >= 2 && rand() < 0.8 ? echoHead(kw, rand) + (t.has('ask') ? '…?' : '…') : null;

  const sounds = pickN(rand, CHII[mood] ?? CHII.plain, rand() < 0.55 ? 2 : 1);

  // 드물게 한마디
  let word = null;
  if (/맛없|써서|쓰다|써…|쓴/.test(s.body)) word = '써…';
  else if (t.has('dislike') && mood !== 'dislike') word = '싫어…';
  else if (t.has('want') && t.has('food')) word = '한입만~';
  else if (t.has('self') && (t.has('want') || t.has('play'))) word = '나도!';
  else if (t.has('food') && t.has('happy')) word = '최고~';

  if (t.has('ask') && echo) parts.push(echo, ...sounds);
  else if (echo) parts.push(sounds[0], echo, ...sounds.slice(1));
  else parts.push(...sounds);
  if (word && rand() < 0.7) parts.push(word);
  if (CHII_ACT[mood] && rand() < 0.45) parts.push(CHII_ACT[mood]);
  return parts.join(' ');
}

export function chiikawa(list, rand) {
  return list.map((s) => chiiOne(s, rand)).join(' ');
}

// ── 하치와레 ────────────────────────────────────────────
// 셋 중 유일하게 문장으로 말한다. 말끝을 작은 ッ로 끊고(먹잣, 고마웟), 모음을 늘이고(그렇지이),
// 말 순서를 뒤집고(따 보고 싶다, 면허!!), 위기에는 「なんとかなれーッ」.

const NANTOKA = ['어떻게든 돼라~앗!!', '어떻게든 되어라앗!!'];

function koGeo(text) {
  // 한국 더빙판 하치와레는 '그'를 '고'로 발음한다
  return text.replace(/(^|\s)그(거|게|건|걸|런|럼|치)/g, '$1고$2');
}

// 앞쪽 명사 하나를 문장 끝으로 (도치)
function invert(a, last) {
  if (!a.pre) return null;
  const words = a.pre.split(/\s+/);
  const idx = invertIndex(words);
  if (idx < 0) return null;
  const noun = stripJosa(words[idx]);
  const rest = words.filter((_, i) => i !== idx);
  return `${[...rest, last].join(' ')}, ${noun}`;
}

function politeLast(a) {
  const m = casualLast(a);
  if (a.mood === 'prop') return conj(a.stem, '어요');
  if (/[까래지]$/.test(m)) return m + '요';
  return conj(a.stem, '어요', { copula: a.copula });
}

function hachiOne(s, rand, once) {
  const a = s.a;
  const t = s.tags;
  const sad = t.has('sad') || t.has('scared');
  let line;

  if (!a.ok) {
    // 명사만 있는 말: 치킨! → 치킨!! 최고잖아!!
    const w = s.body;
    if (a.greet) line = '';
    else line = t.has('ask') ? `${drawl(w)}?` : `${w}!!`;
  } else {
    // 선생님(랏코) 같은 윗사람에게는 존댓말: 감사해욧!!
    const last = SUPERIOR.test(s.body) ? politeLast(a) : casualLast(a);
    switch (a.mood) {
      case 'ques': {
        if (/(^|\s)(뭐|뭘|무슨)/.test(s.body) && rand() < 0.6) line = `뭐야 뭐야? ${withPre(a, drawl(last))}?`;
        else if (rand() < 0.45 && !/(^|\s)(왜|어디|언제|누구|어떻게|몇)/.test(s.body)) line = `그 말은… ${withPre(a, quoteForm(a))} 거야?!`;
        else line = `${withPre(a, drawl(last))}?`;
        break;
      }
      case 'prop':
        line = `${withPre(a, clip(last))}! ${clip(last)}!`;
        break;
      case 'imp':
      case 'promise':
        line = `${withPre(a, drawlClip(last))}!`;
        break;
      default: {
        const r = rand();
        const inv = invert(a, sad ? last : clip(last));
        if (inv && r < 0.35) line = `${inv}${sad ? '…' : '!!'}`;
        else if (sad || t.has('tired')) line = `${withPre(a, drawl(last))}…`;
        else if (r < 0.65) line = `${withPre(a, clip(last))}!!`;
        else line = `${withPre(a, drawlClip(last))}!`;
      }
    }
    // 「…さッ」 끼워 넣기: 어제 말야앗, …
    const words = line.split(' ');
    if (words.length >= 4 && a.mood !== 'ques' && rand() < 0.3) {
      words[0] = `${words[0]} 말야앗,`;
      line = words.join(' ');
    }
  }

  const before = [];
  const after = [];
  const add = (arr, key, text) => once(key) && arr.push(text);
  if (/울었|울고|울어|눈물/.test(s.body)) add(before, 'cry', '울어 버렸다!!!');
  if (t.has('surprised')) add(before, 'eh', pickN(rand, ['에에엣!?', '앗!!'], 1)[0]);
  if (t.has('greet') && /안녕|하이|ㅎㅇ/.test(s.body)) add(before, 'hi', '안녕~!');
  if (/어서 ?와/.test(s.body)) add(before, 'welcome', '어서 와앗!');
  if (t.has('thanks') && !/(고마|감사)/.test(s.body)) add(after, 'thanks', '고마웟!!');
  if (t.has('sorry') && !/^(미안|죄송)/.test(s.body)) add(after, 'sorry', '미안해앳…');
  if (t.has('bye')) add(after, 'bye', '그럼 내일 또 봐앗!!');
  if (t.has('praise')) add(after, 'praise', pickN(rand, ['장하닷!', '최고잖아!!'], 1)[0]);
  // 「○○が○○～」 시 같은 탄식
  if (t.has('hungry') && rand() < 0.5) add(after, 'lament', '위가 쪼그라들어~..');
  else if ((t.has('sad') || t.has('dislike')) && rand() < 0.45) add(after, 'lament', '기쁨이 없어~…');
  else if (t.has('tired') && rand() < 0.5) add(after, 'lament', '기운이… 없어~…');
  if ((t.has('food') || t.has('drink')) && /맛있|맛나/.test(s.body) && rand() < 0.5) add(after, 'yum', '엄…청… 맛있어—');
  else if ((t.has('happy') || t.has('play')) && !sad && rand() < 0.45) add(after, 'best', '최고잖아!!');
  if (sad || t.has('dislike') || (t.has('work') && t.has('neg'))) {
    if (rand() < 0.7) add(after, 'nantoka', pickN(rand, NANTOKA, 1)[0]);
  } else if (t.has('work') && rand() < 0.4) add(after, 'fight', '같이 힘내잣!!');

  const said = [...before, line, ...after].filter(Boolean).join(' ');
  return koGeo(SUPERIOR.test(s.body) ? said : deformal(said));
}

export function hachiware(list, rand) {
  const once = onceSet();
  return list.map((s) => hachiOne(s, rand, once)).join(' ');
}

// ── 우사기 ──────────────────────────────────────────────
// 거의 기성만 낸다. 다만 억양이 실제 문장을 따라간다 (ウラーヤッハ = カレーみっつ).
// 그래서 입력 어절마다 첫 모음과 길이를 보고 우라/야하/푸루/이야 계열 소리를 만든다.

const FAMILY = {
  a: ['야하', '야하하', '야하야하', '야─하'],
  u: ['우라', '우라라', '우라라라', '우~라~'],
  o: ['푸루', '푸루야', '푸루루루', '뿌르르르'],
  eo: ['후웅', '후웅', '후우웅', '흐응'],
  i: ['이야', '이야하', '이이야핫', '이야핫'],
};

function vowelFamily(ch) {
  const p = split(ch);
  if (!p) return 'u';
  if ('ㅏㅑㅘ'.includes(p.jung)) return 'a';
  if ('ㅜㅠㅝ'.includes(p.jung)) return 'u';
  if ('ㅗㅛ'.includes(p.jung)) return 'o';
  if ('ㅓㅕㅡ'.includes(p.jung)) return 'eo';
  return 'i';
}

function usagiWord(word, rand) {
  const syl = [...word].filter((c) => split(c));
  if (!syl.length) return null;
  const fam = FAMILY[vowelFamily(syl[0])];
  const len = syl.length;
  const idx = Math.min(fam.length - 1, Math.max(0, len - 2 + (rand() < 0.3 ? 1 : 0)));
  return fam[idx];
}

const USAGI_END = {
  ask: ['하아?', '흐응?', '야하?', '하아? 하아?'],
  angry: ['하아?', '브르르르르', '하아? 하아?', '으으읏 기이이'],
  no: ['하아?', '흐응.'],
  yes: ['우라!', '푸루야', '후웅.', '야하!'],
  greet: ['야하!', '야하앗!!'],
  bye: ['푸루야', '푸루야…'],
  food: ['우걱우걱', '하아아아앗!!!', '우아', '우로루'],
  hungry: ['우걱우걱', '하아아아앗!!!'],
  drink: ['꿀꺽', '푸하앗!!'],
  sleep: ['후가라 무냐라', '후우…'],
  tired: ['후우…', '푸슝', '후가라 무냐라'],
  sad: ['푸슝', '우~…이~…'],
  surprised: ['하아?!', '우아', '하앗!!'],
  happy: ['야하앗!!', '뿌르르르르', '우라라라라', '이이이야아아앗하!!!'],
  love: ['후웅', '유후후후후', '야하!'],
  praise: ['후웅~', '이야핫!', '야하!'],
  play: ['우라라라라', '야하야하야하', '이야핫!'],
  thanks: ['푸루야', '야하!'],
  scared: ['하아?', '우라앗!'],
  work: ['우라!', '우랏!', '영차 우라!'],
  bang: ['야하앗!!', '이야핫!!', '우랏!'],
  plain: ['우라.', '야핫', '후웅.', '푸루야'],
};

function usagiOne(s, rand) {
  const t = s.tags;
  const out = [];
  if (/ㅋㅋ|ㅎㅎ|하하|웃겨|웃기/.test(s.body + (s.a.tail || ''))) return pickN(rand, ['캬핫 캬하하핫', '유후후후후', '캬하핫'], 1)[0];
  if (/아파|아프|아야/.test(s.body)) return '우깃!!';
  if (/맵|매워|매운/.test(s.body)) return '우루우루… 우라!';
  if (/어서 ?오세요|어서 ?와/.test(s.body)) return '먀아아아아';
  if (/노래|춤|파티/.test(s.body)) out.push('우·라·야·하 ♬');

  // 짧은 말이면 상황 소리만, 길면 어절마다 소리를 낸다
  const words = s.body.split(/\s+/).filter(Boolean);
  if (words.length >= 3 || (words.length === 2 && !USAGI_END[s.mood])) {
    const sounds = words.slice(0, 3).map((w) => usagiWord(w, rand)).filter(Boolean);
    if (sounds.length) out.push(sounds.join(rand() < 0.15 ? '·' : ' '));
  }
  const end = USAGI_END[s.mood] ?? USAGI_END.plain;
  out.push(pickN(rand, end, 1)[0]);
  if (t.has('bang') && !/[!?]$/.test(out[out.length - 1])) out[out.length - 1] += '!!';
  return out.join(' ');
}

export function usagi(list, rand) {
  // 길게 말해도 세 문장까지만
  const out = list.slice(0, 3).map((s) => usagiOne(s, rand));
  if (list.length > 3) out.push('우라라라라라…!!');
  return out.join(' ');
}
