// 캐릭터 말투 공통 도구
import { conj, toHae, hasJong, isAdjective, isPastStem, split, join } from '../korean.js';

export { hasJong };

// 문장의 "마지막 말" 앞부분 (pre)과 반말 끝말을 합친다
export function withPre(a, last) {
  return (a.pre ? a.pre + ' ' : '') + last;
}

// 간접 인용형: 먹는다는 / 좋다는 / 학생이라는 / 놀자는
export function quoteForm(a) {
  if (!a.ok) return null;
  const s = a.stem;
  if (a.mood === 'prop') return s + '자는';
  if (a.copula) return s + (hasJong(s) ? '이라는' : '라는');
  if (isPastStem(s) || isAdjective(s)) return s + '다는';
  return conj(s, '다') + '는';
}

// 반말 끝말 (먹어, 놀자, 할게…) — analyze 결과에서
export function casualLast(a) {
  if (!a.ok) return a.word;
  if (a.will) return conj(a.stem, 'ㄹ래');
  if (a.shall) return conj(a.stem, 'ㄹ게').replace(/게$/, '까');
  if (a.tag) return conj(a.stem, '지');
  switch (a.mood) {
    case 'prop':
      return conj(a.stem, '자');
    case 'promise':
      return conj(a.stem, 'ㄹ게');
    case 'will':
      return conj(a.stem, 'ㄹ래');
    case 'exclaim':
      return conj(a.stem, '네');
    default:
      if (a.shall) return conj(a.stem, 'ㄹ게').replace(/게$/, '까');
      return toHae(a.stem, { copula: a.copula });
  }
}

// 마지막 글자에 받침 ㅅ: 배고파 → 배고팟 (받침이 있으면 그대로)
export function clip(word) {
  const ch = word.slice(-1);
  const p = split(ch);
  if (!p || p.jong) return word;
  return word.slice(0, -1) + join(p.cho, p.jung, 'ㅅ');
}

const PLAIN_VOWEL = { ㅘ: 'ㅏ', ㅝ: 'ㅓ', ㅙ: 'ㅐ', ㅚ: 'ㅔ', ㅟ: 'ㅣ', ㅢ: 'ㅣ', ㅑ: 'ㅏ', ㅕ: 'ㅓ', ㅛ: 'ㅗ', ㅠ: 'ㅜ', ㅒ: 'ㅐ', ㅖ: 'ㅔ' };

function echoVowel(word) {
  const p = split(word.slice(-1));
  if (!p || p.jong) return null;
  return join('ㅇ', PLAIN_VOWEL[p.jung] ?? p.jung);
}

// 끝 모음 늘이기: 배고파 → 배고파아, 그렇지 → 그렇지이
export function drawl(word, n = 1) {
  const v = echoVowel(word);
  return v ? word + v.repeat(n) : word;
}

// 늘이고 끊기: 배고파 → 배고파앗, 돼라 → 돼라앗
export function drawlClip(word) {
  const v = echoVowel(word);
  if (!v) return word;
  return word + clip(v);
}

export function pickN(rand, arr, k) {
  const pool = [...arr];
  const out = [];
  while (pool.length && out.length < k) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  return out;
}

// 이/가는 떡볶이·휴가처럼 낱말 끝일 때가 많아 떼지 않는다
const JOSA = /(은|는|을|를|에서|에게|한테|으로|와|과|이랑|랑|도|만|까지|부터|의|처럼|보다|이나|에|로)$/;
const STOP = new Set(
  '나 너 저 그 이 것 거 좀 진짜 정말 너무 아주 완전 그냥 오늘 내일 어제 지금 이제 우리 다 또 막 제일 되게 엄청 많이 조금 같이 왜 뭐 어디 언제 누구 어떻게 이거 저거 그거 여기 거기 저기 내 네 제 니 난 넌 나는 너는 저는 내가 네가 제가 우린 우리는 그래서 그래도 그런데 근데 그리고 하지만 요즘 아까 혹시 제발 빨리 잘 못 안 더 덜'.split(' '),
);

export function stripJosa(w) {
  const clean = w.replace(/[^가-힣]/g, '');
  if (clean.length <= 1) return clean;
  const stripped = clean.replace(JOSA, '');
  return stripped.length ? stripped : clean;
}

// 문장 앞부분에서 가장 내용이 많은 낱말 (조사 뗀 꼴)
export function keyWord(a) {
  const words = (a.pre ? a.pre.split(/\s+/) : [])
    .filter((w) => !/(으러|러|아서|어서|해서|하고|하면|으면|려고|도록|게|지만|는데|니까|어도|아도|해도|기)$/.test(w) || /(을|를|은|는)$/.test(w))
    .map(stripJosa)
    .filter((w) => w && !STOP.has(w));
  if (!words.length) return null;
  return words.reduce((best, w) => (w.length > best.length ? w : best), words[0]);
}

// 앞 1~2음절만 따라 하기: 라면 → 라, 챠루메라 → 챠루
export function echoHead(word, rand) {
  const syl = [...word];
  if (syl.length >= 3) return syl.slice(0, 2).join('');
  if (syl.length === 2) return rand() < 0.5 ? syl[0] : word;
  return word;
}


// 도치할 명사 고르기: 맨 앞 낱말(또는 대명사·시간말 바로 뒤)만, 꾸밈말(매운, 좋은)은 빼고
const INVERT_SKIP = /^(나|내|저|제|너|네|우리|오늘|내일|어제|요즘|아까|이따|방금|매일|항상|다시|벌써|아직|계속|진짜|정말|너무|같이|이거|그거|저거|빨리|조금|아주|완전|그냥|많이|좀|덕분|때문|혹시|제발|그래|그런데|근데|그리고|하지만|한잔|한번|다음)/;
const MODIFIER = /(운|쁜|픈|은|는|던|한|된|른|난|진|큰|싼|단|긴|센|울|을)$/;
const NOT_NOUN = /(에|에서|에게|한테|으로|로|처럼|부터|까지|만|러|고|서|면|게|기|히|지|도록|이|가)$/;

export function invertIndex(words) {
  for (let i = 0; i < words.length && i < 2; i++) {
    const w = words[i];
    if (INVERT_SKIP.test(w)) continue;
    if (!/^[가-힣]{2,}$/.test(w)) return -1;
    const particle = /(을|를|은|는|도)$/.test(w) && stripJosa(w).length >= 2;
    if (particle || !(MODIFIER.test(w) || NOT_NOUN.test(w))) return i;
    return -1;
  }
  return -1;
}

export const SUPERIOR = /(선생님|사장님|부장님|팀장님|선배님|사부님|교수님|과장님|대표님)/;

// 존댓말 1인칭 → 반말 (저는 → 나는)
export function deformal(text) {
  return text
    .replace(/(^|\s)저희/g, '$1우리')
    .replace(/(^|\s)저는(?=[\s…,.!?]|$)/g, '$1나는')
    .replace(/(^|\s)제가(?=[\s…,.!?]|$)/g, '$1내가')
    .replace(/(^|\s)저도(?=[\s…,.!?]|$)/g, '$1나도')
    .replace(/(^|\s)저를(?=[\s…,.!?]|$)/g, '$1나를')
    .replace(/(^|\s)저(?=[\s…])/g, '$1나')
    .replace(/(^|\s)제(?=[\s…])/g, '$1내');
}

// 한 번 쓴 말버릇은 같은 답에서 또 쓰지 않는다
export function onceSet() {
  const used = new Set();
  return (key) => {
    if (used.has(key)) return false;
    used.add(key);
    return true;
  };
}
