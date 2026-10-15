// 한글 문장 분석 + 어미 활용 도우미.
// 형태소 분석기를 쓰지 않고, 일상 반말/존댓말에서 자주 나오는 문장 끝 모양만 규칙으로 처리한다.

const BASE = 0xac00;
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

export function isHangul(ch) {
  const c = ch?.charCodeAt(0);
  return c >= BASE && c <= 0xd7a3;
}

export function split(ch) {
  if (!isHangul(ch)) return null;
  const c = ch.charCodeAt(0) - BASE;
  return { cho: CHO[Math.floor(c / 588)], jung: JUNG[Math.floor((c % 588) / 28)], jong: JONG[c % 28] };
}

export function join(cho, jung, jong = '') {
  return String.fromCharCode(BASE + CHO.indexOf(cho) * 588 + JUNG.indexOf(jung) * 28 + JONG.indexOf(jong));
}

const last = (s) => s.slice(-1);
const init = (s) => s.slice(0, -1);

export function hasJong(word) {
  const p = split(last(word));
  return !!p && p.jong !== '';
}

function withJong(ch, jong) {
  const p = split(ch);
  return p ? join(p.cho, p.jung, jong) : ch;
}

function withJung(ch, jung) {
  const p = split(ch);
  return p ? join(p.cho, jung, p.jong) : ch;
}

// 조사 고르기: josa('치이카와', '은', '는') → '는'
export function josa(word, withBatchim, withoutBatchim) {
  return hasJong(word) ? withBatchim : withoutBatchim;
}

// ── 어간 사전 ──────────────────────────────────────────────

// ㅂ 불규칙 형용사 (귀여워 → 귀엽)
const B_IRREGULAR = new Set(
  '귀엽 무섭 춥 덥 맵 반갑 어렵 쉽 밉 고맙 부럽 즐겁 무겁 가볍 시끄럽 부드럽 뜨겁 차갑 더럽 외롭 괴롭 그립 아름답 가깝 사랑스럽 자랑스럽 부끄럽 놀랍 아깝 새롭 간지럽 서럽 싱겁 두렵 돕 눕 굽'.split(' '),
);

// 형용사(그림씨). "~다"/"~군"을 붙일 때 동사와 모양이 다르다.
const ADJECTIVES = new Set(
  ('싶 좋 싫 나쁘 맛있 맛없 재밌 재미있 재미없 멋있 멋없 예쁘 이쁘 귀엽 슬프 기쁘 아프 배고프 배부르 고프 졸리 피곤하 행복하 ' +
    '힘들 무섭 춥 덥 크 작 많 적 길 짧 높 낮 멀 가깝 빠르 느리 쉽 어렵 바쁘 심심하 외롭 부럽 고맙 미안하 괜찮 이상하 ' +
    '대단하 멋지 착하 똑똑하 시끄럽 조용하 따뜻하 차갑 뜨겁 맵 달 짜 싱겁 쓰 시원하 깨끗하 더럽 귀찮 신기하 소중하 ' +
    '든든하 편하 불편하 무겁 가볍 반갑 즐겁 아름답 행복하 우울하 속상하 서운하 억울하 답답하 궁금하 불쌍하 귀하 ' +
    '있 없 같 다르 아니 그렇 이렇 저렇 어떻 새롭 아깝 부끄럽 놀랍 두렵 대견하 훌륭하 완벽하 최고 좁 넓 두껍 얇 ' +
    '못생기 잘생기 건강하 튼튼하 약하 강하 무사하 정확하 확실하 중요하 필요하 위험하 안전하 비싸 싸 쉬 무르 부드럽 ' +
    '푹신하 폭신하 말랑하 동그랗 하얗 까맣 빨갛 노랗 파랗')
    .split(' '),
);

// ㄹ로 끝나는 받침 어간(놀, 힘들…)은 "네/는군/니" 앞에서 ㄹ이 빠진다.
function dropL(stem) {
  const p = split(last(stem));
  if (p && p.jong === 'ㄹ') return init(stem) + join(p.cho, p.jung, '');
  return null;
}

export function isPastStem(stem) {
  if (!stem) return false;
  const ch = last(stem);
  const p = split(ch);
  if (!p || p.jong !== 'ㅆ') return false;
  return ch !== '있' && ch !== '밌';
}

export function isAdjective(stem) {
  if (!stem) return false;
  if (ADJECTIVES.has(stem)) return true;
  // "~스럽", "~롭", "~답" 형용사 / "있, 없"으로 끝나는 말
  if (/(스럽|롭|답|있|없|밌|같)$/.test(stem)) return true;
  // 사전 단어로 끝나는 합성어 (너무좋 X, 배고프 O)
  for (let i = 1; i < stem.length; i++) if (ADJECTIVES.has(stem.slice(i)) && stem.slice(i).length >= 2) return true;
  return false;
}

// ── 해체(반말 -어/-아) 모양 → 어간 ─────────────────────────

// '먹어' → '먹', '귀여워' → '귀엽', '배고파' → '배고프', '몰라' → '모르', '해' → '하'
export function stemFromHae(word) {
  if (!word) return null;
  const ch = last(word);
  const p = split(ch);
  if (!p) return null;
  const pre = init(word);
  const prev = last(pre);
  const pp = split(prev);

  // 어/아/여 단독 음절: 바로 앞까지가 어간
  if (p.cho === 'ㅇ' && p.jong === '' && (p.jung === 'ㅓ' || p.jung === 'ㅏ') && pre) {
    return pre;
  }
  if (p.jong !== '') return null; // 해체 어미는 받침이 없다

  if (ch === '해') return pre + '하';
  if (ch === '돼') return pre + '되';
  if (ch === '줘') return pre + '주';

  // 워/와: ㅂ 불규칙이면 앞 글자에 ㅂ 받침, 아니면 우/오
  if (ch === '워' || ch === '와') {
    if (pre && pp && pp.jong === '') {
      const bStem = init(pre) + withJong(prev, 'ㅂ');
      if (B_IRREGULAR.has(bStem) || B_IRREGULAR.has(withJong(prev, 'ㅂ')) || /스러$|로$/.test(pre)) return bStem;
    }
    return pre + (ch === '워' ? '우' : '오');
  }

  // 르 불규칙: 몰라 → 모르, 불러 → 부르 (앞 글자 받침 ㄹ + 라/러)
  if ((ch === '라' || ch === '러') && pp && pp.jong === 'ㄹ' && pre !== '놀') {
    return init(pre) + join(pp.cho, pp.jung, '') + '르';
  }

  // 겹모음 축약 되돌리기
  if (p.jung === 'ㅘ') return pre + join(p.cho, 'ㅗ');
  if (p.jung === 'ㅝ') return pre + join(p.cho, 'ㅜ');
  if (p.jung === 'ㅙ') return pre + join(p.cho, 'ㅚ');
  if (p.jung === 'ㅕ' && !['켜', '펴', '여'].includes(ch)) return pre + join(p.cho, 'ㅣ');

  // ㅡ 탈락: 아파 → 아프, 슬퍼 → 슬프, 커 → 크, 써 → 쓰
  if ((p.jung === 'ㅏ' || p.jung === 'ㅓ') && 'ㅍㅃ'.includes(p.cho)) return pre + join(p.cho, 'ㅡ');
  if (p.jung === 'ㅓ' && 'ㅋㅆㄲㄸ'.includes(p.cho)) return pre + join(p.cho, 'ㅡ');

  // 가, 자, 사, 서, 만나, 비싸, 보내…: 그대로가 어간
  return word;
}

// ── 어간 → 여러 어미 ───────────────────────────────────────

export function conj(stem, ending, { copula = false } = {}) {
  // 받침 있는 명사 + 이다: 학생이다, 학생이잖아 (사과다, 사과잖아는 그대로)
  if (copula && hasJong(stem) && !['어', '어요', '습니다'].includes(ending)) return conj(stem + '이', ending, { copula: true });
  const adj = copula || isAdjective(stem) || isPastStem(stem) || /겠$/.test(stem);
  switch (ending) {
    case '다':
      if (copula) return stem + '다';
      if (adj) return stem + '다';
      if (hasJong(stem) && !dropL(stem)) return stem + '는다';
      return init(stem) + withJong(last(stem), 'ㄴ') + '다';
    case '군':
    case '구나':
      if (adj) return stem + ending;
      return (dropL(stem) ?? stem) + '는' + ending;
    case '네':
    case '니':
      return (dropL(stem) ?? stem) + ending;
    case '냐':
      return stem + '냐';
    case '자':
    case '지':
    case '잖아':
    case '거든':
    case '고':
    case '죠':
      return stem + ending;
    case '어':
      return toHae(stem, { copula });
    case '어요':
      if (copula) return stem + (hasJong(stem) ? '이에요' : '예요');
      if (/아니$/.test(stem)) return stem + '에요';
      return toHae(stem) + '요';
    case '습니다':
      if (copula) return stem + '입니다';
      if (hasJong(stem) && !dropL(stem)) return stem + '습니다';
      return init(stem) + withJong(last(stem), 'ㅂ') + '니다';
    case 'ㄹ게': {
      if (hasJong(stem)) return dropL(stem) ? stem + '게' : stem + '을게';
      return init(stem) + withJong(last(stem), 'ㄹ') + '게';
    }
    case 'ㄹ래': {
      if (hasJong(stem)) return dropL(stem) ? stem + '래' : stem + '을래';
      return init(stem) + withJong(last(stem), 'ㄹ') + '래';
    }
    default:
      return stem + ending;
  }
}

// 어간 → 해체(반말 -어/-아)
export function toHae(stem, { copula = false } = {}) {
  if (!stem) return '';
  if (copula) return stem + (hasJong(stem) ? '이야' : '야');
  if (/아니$/.test(stem)) return stem + '야';
  const ch = last(stem);
  const pre = init(stem);
  const p = split(ch);
  if (!p) return stem;
  if (isPastStem(stem)) return stem + '어';
  if (ch === '하') return pre + '해';
  if (ch === '되') return pre + '돼';
  if (B_IRREGULAR.has(stem) || /(스럽|롭)$/.test(stem)) {
    const base = pre + withJong(ch, '');
    return base + (['돕', '곱'].includes(stem) ? '와' : '워');
  }
  if (ch === '르' && pre) {
    const pp = split(last(pre));
    const bright = pp.jung === 'ㅏ' || pp.jung === 'ㅗ';
    return init(pre) + withJong(last(pre), 'ㄹ') + (bright ? '라' : '러');
  }
  if (p.jong !== '') {
    const bright = p.jung === 'ㅏ' || p.jung === 'ㅗ' || p.jung === 'ㅑ';
    return stem + (bright ? '아' : '어');
  }
  switch (p.jung) {
    case 'ㅏ':
    case 'ㅓ':
    case 'ㅐ':
    case 'ㅔ':
    case 'ㅕ':
      return stem;
    case 'ㅗ':
      return pre + withJung(ch, 'ㅘ');
    case 'ㅜ':
      return pre + withJung(ch, 'ㅝ');
    case 'ㅣ':
      return pre + withJung(ch, 'ㅕ');
    case 'ㅚ':
      return pre + withJung(ch, 'ㅙ');
    case 'ㅡ': {
      const pp = pre ? split(last(pre)) : null;
      const bright = pp && (pp.jung === 'ㅏ' || pp.jung === 'ㅗ');
      return pre + withJung(ch, bright ? 'ㅏ' : 'ㅓ');
    }
    default:
      return stem + '어';
  }
}

// ── 문장 나누기 ────────────────────────────────────────────

// "배고파!! 밥 먹자." → [{ body: '배고파', punct: '!!' }, { body: '밥 먹자', punct: '.' }]
export function sentences(text) {
  const out = [];
  const re = /([^.!?…~\n]+)([.!?…~\n]*)/g;
  let m;
  while ((m = re.exec(text))) {
    const body = m[1].trim();
    const punct = m[2].replace(/\n/g, '');
    if (body) out.push({ body, punct });
    else if (out.length && punct) out[out.length - 1].punct += punct;
  }
  return out;
}

// ── 문장 끝 분석 ───────────────────────────────────────────

const QUESTION_WORDS = /(^|\s)(뭐|뭘|무슨|무엇|왜|어디|어떻게|어때|언제|누구|누가|몇|얼마|어느|어떤)/;

// 문장의 마지막 어절을 분석해서 어간·서법·시제를 돌려준다.
// 결과: { pre, word, stem, copula, mood, polite, past, ok }
//   mood: decl(평서) ques(의문) prop(청유) imp(명령) promise(약속) will(의지) exclaim(감탄) frag(명사/조각)
export function analyze(body, punct = '') {
  const words = body.split(/\s+/);
  let word = words.pop() ?? '';
  // 끝에 붙은 ㅋㅋ, ㅠㅠ, 이모티콘 같은 꼬리 떼기
  const tailMatch = word.match(/([ㄱ-ㅎㅏ-ㅣ^;:)(><♡♥\u{1F300}-\u{1FAFF}]+)$/u);
  let tail = '';
  if (tailMatch && tailMatch[1].length < word.length) {
    tail = tailMatch[1];
    word = word.slice(0, -tail.length);
  } else if (tailMatch) {
    // 어절 전체가 ㅋㅋ/ㅠㅠ 같은 꼬리면 그 앞 어절을 본다
    tail = word;
    word = words.pop() ?? '';
  }
  const pre = words.join(' ');
  const r = { pre, word, tail, stem: null, copula: false, mood: 'frag', polite: false, past: false, ok: false };
  const isQ = punct.includes('?');

  const set = (stem, mood, extra = {}) => {
    Object.assign(r, { stem, mood, ok: !!stem }, extra);
    if (isQ && (r.mood === 'decl' || r.mood === 'frag')) r.mood = 'ques';
    r.past = isPastStem(r.stem);
    return r;
  };

  if (!word || !isHangul(last(word))) return set(null, isQ ? 'ques' : 'frag');

  let w = word;
  if (/^안녕(하세요|하십니까|하셨어요|히\s*계세요|)$/.test(w)) return set(null, 'frag', { greet: true });
  // ── 존댓말 → 반말 ──
  let m;
  if ((m = w.match(/^(.+)습니(다|까)$/))) return set(m[1], m[2] === '까' ? 'ques' : 'decl', { polite: true });
  if (/.니(다|까)$/.test(w)) {
    const ch = w.slice(-3, -2);
    const p = split(ch);
    if (p && p.jong === 'ㅂ') {
      const stemCh = join(p.cho, p.jung, '');
      const stem = w.slice(0, -3) + stemCh;
      const mood = w.endsWith('까') ? 'ques' : 'decl';
      if (stem.endsWith('이') && stem.length > 1) return set(stem.slice(0, -1), mood, { polite: true, copula: true });
      return set(stem, mood, { polite: true });
    }
  }
  if ((m = w.match(/^(.+?)(이에요|이예요|예요|에요)$/))) {
    if (m[1] === '아니' || m[1].endsWith('아니')) return set(m[1], isQ ? 'ques' : 'decl', { polite: true });
    return set(m[1], isQ ? 'ques' : 'decl', { polite: true, copula: true });
  }
  if ((m = w.match(/^(.+?)(으세요|세요|셔요|으십시오|십시오)$/))) {
    return set(m[1], isQ ? 'ques' : 'imp', { polite: true });
  }
  if (w.endsWith('죠') && w.length > 1) w = w.slice(0, -1) + '지';
  else if (w.endsWith('요') && w.length > 1) {
    w = w.slice(0, -1);
    r.polite = true;
  }

  // ── 반말 어미 ──
  const polite = r.polite;
  if ((m = w.match(/^(.+?)(이야|야)$/)) && !/(해|래|봐|줘|가|와)$/.test(m[1])) {
    if (m[1] === '아니' || m[1].endsWith('아니')) return set(m[1], 'decl', { polite });
    if (m[2] === '야' && hasJong(m[1])) return set(m[1], 'decl', { polite, copula: true });
    return set(m[1], 'decl', { polite, copula: true });
  }
  if ((m = w.match(/^(.+?)(는구나|구나|는군|군|구먼)$/))) return set(m[1], 'exclaim', { polite });
  if ((m = w.match(/^(.+?)(잖아|거든|는데|은데|던데|지만|니까|으니까|어서|아서|고)$/)) && m[1]) {
    const s = m[2] === '는데' || m[2] === '은데' ? m[1] : m[1];
    return set(s, 'decl', { polite, soft: m[2] });
  }
  if ((m = w.match(/^(.+?)(을게|ㄹ게)$/))) return set(m[1], 'promise', { polite });
  if (/게$/.test(w) && w.length > 1) {
    const p = split(w.slice(-2, -1));
    if (p && p.jong === 'ㄹ') return set(w.slice(0, -2) + join(p.cho, p.jung, ''), 'promise', { polite });
  }
  if ((m = w.match(/^(.+?)을래$/))) return set(m[1], isQ ? 'ques' : 'will', { polite, will: true });
  if (/래$/.test(w) && w.length > 1) {
    const p = split(w.slice(-2, -1));
    if (p && p.jong === 'ㄹ') return set(w.slice(0, -2) + join(p.cho, p.jung, ''), isQ ? 'ques' : 'will', { polite, will: true });
  }
  if ((m = w.match(/^(.+?)을까$/))) return set(m[1], 'ques', { polite, shall: true });
  if (/까$/.test(w) && w.length > 1) {
    const p = split(w.slice(-2, -1));
    if (p && p.jong === 'ㄹ') return set(w.slice(0, -2) + join(p.cho, p.jung, ''), 'ques', { polite, shall: true });
  }
  if ((m = w.match(/^(.+?)(니|냐|느냐|나)$/)) && m[1].length >= 1 && !(m[2] === '나' && m[1].length < 1)) {
    if (m[2] !== '나' || isQ) return set(m[1], 'ques', { polite });
  }
  if ((m = w.match(/^(.+?)(어라|아라|거라|해라)$/))) {
    return set(m[2] === '해라' ? m[1] + '하' : m[1], 'imp', { polite });
  }
  if ((m = w.match(/^(.*?)(줘|주세)$/))) return set(m[1] + '주', isQ ? 'ques' : 'imp', { polite, give: true });
  if (/^(어떡해|어떡하지|어쩌지|어떡하냐|어떻게 해)$/.test(w)) return set('어떡하', 'ques', { polite });
  if ((m = w.match(/^(.+?)자$/)) && !/(남|여|의|과|모|감|부|과|사)$/.test(m[1])) return set(m[1], isQ ? 'ques' : 'prop', { polite });
  if ((m = w.match(/^(.+?)네$/)) && m[1]) return set(m[1], isQ ? 'ques' : 'exclaim', { polite });
  if ((m = w.match(/^(.+?)지$/)) && m[1]) return set(m[1], isQ ? 'ques' : 'decl', { polite, tag: true });
  if ((m = w.match(/^(.+)다$/)) && m[1]) {
    let s = m[1];
    if (s.endsWith('는')) s = s.slice(0, -1);
    else {
      const p = split(last(s));
      if (p && p.jong === 'ㄴ' && !isAdjective(s)) s = init(s) + join(p.cho, p.jung, '');
    }
    return set(s, isQ ? 'ques' : 'decl', { polite });
  }

  const stem = stemFromHae(w);
  // 빨리 와 / 얼른 먹어: 반말 해체는 명령과 평서가 같은 꼴이라 부사로 가린다
  const urge = !isQ && /(^|\s)(빨리|얼른|어서|제발|당장|좀)(\s|$)/.test(pre);
  if (stem && stem !== w) return set(stem, isQ ? 'ques' : urge && !isPastStem(stem) ? 'imp' : 'decl', { polite });
  if (stem && (polite || ADJECTIVES.has(stem) || /[가자사서타차내해봐줘와]$/.test(w))) {
    return set(stem, isQ ? 'ques' : 'decl', { polite });
  }
  return set(null, isQ ? 'ques' : 'frag', { polite });
}

// 분석 결과의 마지막 어절을 새 어미로 바꾼 문장을 만든다.
export function rebuild(a, ending) {
  if (!a.ok) return null;
  const word = conj(a.stem, ending, { copula: a.copula });
  return (a.pre ? a.pre + ' ' : '') + word;
}

// 문장 전체를 반말 해체로
export function toCasual(a) {
  if (!a.ok) return (a.pre ? a.pre + ' ' : '') + a.word;
  switch (a.mood) {
    case 'prop':
      return rebuild(a, '자');
    case 'promise':
      return rebuild(a, 'ㄹ게');
    case 'will':
      return rebuild(a, 'ㄹ래');
    case 'imp':
      return (a.pre ? a.pre + ' ' : '') + (a.give ? toHae(a.stem) : toHae(a.stem));
    case 'exclaim':
      return rebuild(a, '네');
    default:
      if (a.shall) return (a.pre ? a.pre + ' ' : '') + conj(a.stem, 'ㄹ게').replace(/게$/, '까');
      return rebuild(a, '어');
  }
}
