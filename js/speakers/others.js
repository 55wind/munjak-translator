// 시사 · 쿠리만쥬 · 랏코 · 모몽가
// 근거: 나무위키·ピクシブ百科事典·chiikawapark 연재 받아쓰기·hatena 『ちいかわファン』 (리서치 노트 참고)
import { conj, toHae, hasJong } from '../korean.js';
import { withPre, drawl, stripJosa, onceSet, deformal, invertIndex } from './common.js';

const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

// ── 시사 ────────────────────────────────────────────────
// 기본은 존댓말, 말끝을 길게 늘인다 (〜でーす / 〜まーす / 〜くださーい / 〜ませ～ん).
// 기분은 「◯◯シーサー」 말장난으로 붙인다 (うれシーサー, おいシーサー, くやシーサー…).

const SHISA_PUN = {
  happy: ['기쁘시사~', '왠지 기쁘시사~'],
  love: ['기쁘시사~'],
  food: ['맛있으시사~', '육즙 가득하시사~'],
  hungry: ['허무하시사~'],
  sad: ['마음이 괴로우시사…', '허무하시사…'],
  dislike: ['답답하시사…'],
  angry: ['분하시사…'],
  sorry: ['부끄러우시사…'],
  praise: ['다정하시사~'],
  thanks: ['다정하시사~'],
  scared: ['엄하시사…'],
  work: ['엄하시사…'],
  tired: ['허무하시사…'],
  surprised: ['눈부시사…!'],
};

function politeSelf(text) {
  return text
    .replace(/(^|\s)(나는|난)(?=\s|$)/g, '$1저는')
    .replace(/(^|\s)내가(?=\s|$)/g, '$1제가')
    .replace(/(^|\s)나도(?=\s|$)/g, '$1저도')
    .replace(/(^|\s)나를(?=\s|$)/g, '$1저를')
    .replace(/(^|\s)나랑(?=\s|$)/g, '$1저랑')
    .replace(/(^|\s)나(?=\s)/g, '$1저')
    .replace(/(^|\s)내(?=\s)/g, '$1제')
    .replace(/(^|\s)우리(?=\s|$)/g, '$1저희')
    .replace(/(^|\s)(너는|넌)(?=\s|$)/g, '$1손님은')
    .replace(/(^|\s)(네가|니가)(?=\s|$)/g, '$1손님이')
    .replace(/(^|\s)너(?=\s)/g, '$1손님')
    .replace(/(선생님|사장님|부장님|팀장님|스승님|선배님|과장님)/g, '사부님');
}

function shisaLast(a, sad) {
  const s = a.stem;
  const tilde = sad ? '~…' : '~';
  if (a.will) return conj(s, 'ㄹ래') + '요?';
  if (a.shall) return conj(s, 'ㄹ게').replace(/게$/, '까') + '요~?';
  switch (a.mood) {
    case 'prop':
      return `같이 ${conj(s, '어요')}${tilde}!`;
    case 'promise':
      return conj(s, 'ㄹ게') + '요~!!';
    case 'imp':
      return (a.give ? s : toHae(s) + ' 주') + '세요~!';
    case 'ques':
      if (a.tag) return conj(s, '죠') + '~?';
      return conj(s, '어요', { copula: a.copula }) + '?';
    default:
      return conj(s, '어요', { copula: a.copula }) + tilde + (sad ? '' : '!');
  }
}

function shisaOne(s, rand, once, tail) {
  const a = s.a;
  const t = s.tags;
  const sad = t.has('sad') || t.has('tired') || t.has('sorry');
  const before = [];
  const after = [];
  let line = '';

  if (/어서 ?와|어서 ?오/.test(s.body) || (t.has('greet') && /안녕|하이|ㅎㅇ|반가/.test(s.body))) {
    if (once('greet')) before.push(pick(rand, ['응먀—치! 어서 오세요~!', '어서 오세요~!!', '응먀—치~!']));
  }
  if (/^잘 ?자/.test(s.body)) {
    line = '안녕히 주무세요~!';
  } else if (a.ok && !a.greet) {
    // 존댓말 끝을 늘인다: 열심히 할게요~!!
    line = withPre({ ...a, pre: a.pre }, shisaLast(a, sad));
    if (a.mood === 'prop' && /(^|\s)같이(\s|$)/.test(a.pre)) line = line.replace(/(^|\s)같이 /, '$1');
  } else if (!a.greet) {
    const yo = hasJong(s.body) ? '이요' : '요';
    line = /[가-힣]$/.test(s.body) ? s.body + yo + (t.has('ask') ? '?' : '~!') : s.body + (s.punct || '!');
  }

  if (t.has('thanks') && once('thanks')) after.push(pick(rand, ['탄디가—탄디!', '감사합니다~!! 탄디가—탄디!']));
  if (t.has('sorry') && once('sorry')) before.push('앗… 죄송해요…');
  if (t.has('surprised') && once('surprised')) before.push(pick(rand, ['앗 엣…!', '하앗…!']));
  if (t.has('bye') && once('bye')) after.push('조심히 가세요~ッ!');
  if ((t.has('work') || t.has('scared')) && once('ganbaru')) tail.push('어떻게 될지… 모르겠지만… 열심히 할게요~!!');
  if ((t.has('hungry') || t.has('food')) && !t.has('neg') && rand() < 0.4 && once('ramen')) tail.push('로우에서 라멘 드시고 가세요~!');
  if ((t.has('happy') || t.has('play')) && rand() < 0.35 && once('laugh')) after.push('에헤헷');
  if (/춤|노래|파티|축제/.test(s.body) && once('dance')) after.push('스잇! 스잇!');
  return politeSelf([...before, line, ...after].filter(Boolean).join(' '));
}

export function shisa(list, rand) {
  const once = onceSet();
  const tail = [];
  const body = [...list.map((s) => shisaOne(s, rand, once, tail)), ...tail].join(' ');
  // 말장난은 만화 칸 옆 손글씨처럼 맨 끝에 하나만
  const mood = list.map((s) => s.mood).find((m) => SHISA_PUN[m]);
  return mood ? `${body} (${pick(rand, SHISA_PUN[mood])})` : body;
}

// ── 쿠리만쥬 ────────────────────────────────────────────
// 독자에게는 대사가 들리지 않는 캐릭터. 한잔 넘긴 뒤 「ハァーッ！」, 몸짓, O/X 손짓이 전부.
// 아주 드물게 어른의 한마디 (自分を 肝臓だと思いなさい).

const KURI_DO = {
  drink: ['(캔맥주를 딴다)', '(꿀꺽꿀꺽)', '(한 모금 쭉)'],
  food: ['(연어포를 씹는다)', '(우물우물)', '(안주를 집는다)'],
  hungry: ['(연어포를 꺼낸다)', '(안주를 내민다)'],
  yes: ['(손으로 O)', '(끄덕끄덕)'],
  no: ['(손으로 X)', '(도리도리)'],
  dislike: ['(손으로 X)', '(도리도리)'],
  sad: ['(어깨를 토닥인다)', '(조용히 잔을 채워 준다)'],
  tired: ['(이마를 짚는다)', '(재첩국을 데운다)'],
  thanks: ['(끄덕)', '(잔을 든다)'],
  praise: ['(엄지 척)', '(끄덕끄덕)'],
  love: ['(잔을 든다)', '(흐뭇하게 본다)'],
  greet: ['(잔을 들어 인사)', '(손을 든다)'],
  bye: ['(손을 흔든다)'],
  sleep: ['(이불을 덮어 준다)', '(꾸벅꾸벅)'],
  work: ['(캔커피를 사 준다)', '(어깨를 토닥인다)'],
  happy: ['(건배)', '(한 모금 쭉)'],
  scared: ['(부들부들)'],
  angry: ['(연어포로 때린다)'],
  sorry: ['(괜찮다는 손짓)'],
};

const KURI_SAY = {
  drink: ['하아—ㅅ!!', '캬아~!', 'ッ하아—ㅅ!'],
  food: ['하아—ㅅ!', '하아…', '캬아~'],
  hungry: ['…하아—ㅅ', '하아…'],
  happy: ['캬아~!', '하아…', '하아—ㅅ!'],
  love: ['하아……'],
  sad: ['쯧… 후우…', '하아…………'],
  tired: ['쯧… 후우…', '후우…'],
  scared: ['하악—! 하악—!', '하아아아아앗!!'],
  surprised: ['하아아아앗!!', '하악—!'],
  angry: ['크아…!', '하악!!'],
  yes: ['…응.', '…하아.'],
  praise: ['…응.', '하아…'],
  thanks: ['…응.', '하아…'],
  no: ['…쯧.', '흐음.'],
  dislike: ['…쯧.', '흐음.'],
  plain: ['…하아—ㅅ', '하아.', '…흐음.'],
};

function kuriOne(s, rand, once) {
  const t = s.tags;
  let mood = t.has('drink') ? 'drink' : s.mood;
  if (/맵|매워|매운|겨자|와사비/.test(s.body)) return '(맛보고) 카아—…!';
  if (/술|맥주|소주|한잔|한 잔/.test(s.body) && /끊|못 마|안 마|금주/.test(s.body)) return '하아아아아—————ㅅ (면허증을 치켜든다)';
  const out = [];
  const act = KURI_DO[mood] ?? (t.has('ask') ? ['(고개를 갸웃)', '(턱을 쓰다듬는다)'] : ['(가만히 듣는다)', '(잔을 기울인다)']);
  out.push(pick(rand, act));
  out.push(pick(rand, KURI_SAY[mood] ?? KURI_SAY.plain));
  if ((t.has('tired') || t.has('drink') || t.has('work')) && rand() < 0.3 && once('advice')) out.push('…(보소리) 자기 자신을… 간이라고 생각하렴.');
  return out.join(' ');
}

export function kurimanju(list, rand) {
  const once = onceSet();
  // 문장이 많아도 쿠리만쥬는 길게 말하지 않는다: 가장 감정이 실린 문장 하나에만 반응
  const main = list.find((s) => s.tags.has('drink')) ?? list.find((s) => !['plain', 'ask', 'bang'].includes(s.mood)) ?? list[0];
  const out = kuriOne(main, rand, once);
  return list.length > 1 && !/하아—ㅅ/.test(out) ? `${out} …하아—ㅅ` : out;
}

// ── 랏코 ────────────────────────────────────────────────
// 하드보일드한 반말 (〜だッ / 〜かッ / 〜だな / 〜だぞ), 말끝을 끊고
// 핵심어를 문장 맨 끝으로 보내는 도치법이 시그니처: 「行くか…『祝いの』……焼肉」 「どうだ？ 特訓」.

function rakkoLast(a) {
  const s = a.stem;
  // 갈래? / 먹을까? → 갈까…? / 같이 놀자 → 놀자.
  if (a.will || a.shall) return `${conj(s, 'ㄹ게').replace(/게$/, '까')}…?`;
  if (a.mood === 'prop') return `${conj(s, '자')}.`;
  // 도와줘 → 도와주마. (부탁받으면 들어준다)
  if (a.mood === 'imp' && a.give) return s + '마.';
  switch (a.mood) {
    case 'ques':
      if (a.tag) return conj(s, '지') + '?';
      if (a.copula) return s + (hasJong(s) ? '이냐?' : '냐?');
      return conj(s, '냐') + '?';
    case 'imp':
      return conj(s, '어') + '라.';
    case 'promise':
      // 내가 할게 → 내가 하지.
      return conj(s, '지') + '.';
    case 'exclaim':
      return conj(s, '군') + '.';
    default:
      return conj(s, '다', { copula: a.copula }) + '.';
  }
}

// 핵심 명사를 끝으로: "시험 망쳤어" → "망쳤다… '시험'"
function rakkoInvert(a, last) {
  if (!a.pre) return null;
  const words = a.pre.split(/\s+/);
  const idx = invertIndex(words);
  if (idx < 0) return null;
  const noun = stripJosa(words[idx]);
  const rest = words.filter((_, i) => i !== idx);
  const head = [...rest, last.replace(/[.?]$/, '')].join(' ');
  const q = /\?$/.test(last) ? '?' : '';
  return `${head}${q ? '?' : '…'} '${noun}'`;
}

function rakkoOne(s, rand, once) {
  const a = s.a;
  const t = s.tags;
  const before = [];
  const after = [];
  let line = '';

  if (/단 ?거|달달|디저트|케이크|푸딩|아이스크림|초콜릿|사탕|과자|도넛|마카롱|빵|쿠키|젤리/.test(s.body) && once('sweet')) before.push('호…… (볼을 주무른다)');
  if (t.has('greet') && once('greet')) before.push(pick(rand, ['여어, 잘 지냈냐!', '여어…']));
  if (a.mood === 'imp' && /칭찬/.test(s.body)) {
    line = '…잘했다.';
  } else if (/^잘 ?자/.test(s.body)) {
    line = '푹 자라. 내일은 특훈이다.';
  } else if (a.ok && !a.greet) {
    const last = rakkoLast(a);
    const inv = rand() < 0.65 ? rakkoInvert(a, last) : null;
    line = inv ?? withPre(a, last);
    // 무게 잡는 말줄임
    if (!inv && a.pre && rand() < 0.4) line = `${a.pre}… ${last}`;
  } else if (!a.greet) {
    line = `'${s.body}'…인가.`;
  }

  if (t.has('thanks') && !/(고마|감사)/.test(s.body) && once('thanks')) after.push('감사한다!');
  if (/^(고마|감사)/.test(s.body)) line = '감사한다!';
  if (t.has('sorry') && once('sorry')) after.push('괜찮다 괜찮다… 미안하군!');
  if (t.has('surprised') && once('surprised')) before.push(pick(rand, ['뭐…라고!?', '이, 이건……!!']));
  if (t.has('scared') && once('calm')) after.push('…조급함은 금물이다.');
  if (t.has('sad') && once('sad')) after.push('…이것도 추억인가.');
  if (t.has('work') && once('work')) after.push(pick(rand, ['인내다.', '강해져라.']));
  if ((t.has('praise') || t.has('self')) && t.has('want') && once('praise')) after.push('…자신을 가져라.');
  if ((t.has('hungry') || t.has('food')) && !/단 ?거|디저트/.test(s.body) && rand() < 0.5 && once('meal')) after.push('맛있는 밥, 먹여 주마.');
  if (t.has('bye') && once('bye')) after.push('그럼 또, 특훈에서 보자!!');

  return deformal([...before, line, ...after].filter(Boolean).join(' '));
}

export function rakko(list, rand) {
  const once = onceSet();
  return list.map((s) => rakkoOne(s, rand, once)).join(' ');
}

// ── 모몽가 ──────────────────────────────────────────────
// 명령형 (褒めろッ / 見ろッ / よこせ / よこしなッ), 칭찬과 관심을 요구한다.
// 거절은 「イーヤーヤダヤダ」, 말 중간을 늘이고 끊는다 (かわっっいい / サイッコ～ / うンまい).

function momoStretch(text) {
  return text
    .replace(/진짜/g, '지인짜')
    .replace(/정말/g, '저엉말')
    .replace(/너무/g, '너~무')
    .replace(/전부/g, '저~언부')
    .replace(/엄청/g, '어~엄청')
    .replace(/최고/g, '최엇고~')
    .replace(/귀여/g, '귀엽~')
    .replace(/귀엽~워/g, '귀여~워')
    .replace(/맛있/g, '마앗있');
}

function dropSelf(text) {
  return text.replace(/(^|\s)(나|난|나는|내가|저|저는|제가)\s+/g, '$1').trim();
}

function momoLast(a) {
  const s = a.stem;
  switch (a.mood) {
    case 'imp':
      // 도와줘 → 도와라앗 / 빨리 와 → 와라앗
      if (a.give) return a.word === '줘' ? '줘라앗!' : a.word.replace(/줘$/, '라앗!');
      return toHae(s) + '라앗!';
    case 'prop':
      return `${conj(s, '자')}앗! 빨리!`;
    case 'promise':
      return `${conj(s, 'ㄹ게')}. 고마워해라!`;
    case 'ques':
      if (a.shall) return `${drawl(conj(s, 'ㄹ게').replace(/게$/, '까'))}~?`;
      if (a.will) return `${conj(s, 'ㄹ래')}~? …당연하지!`;
      if (a.tag) return `${conj(s, '지')}이~?`;
      return `${drawl(toHae(s, { copula: a.copula }))}~?`;
    default: {
      // 〜んだよッ: 배고프다고! / 먹고 싶단 말이야앗!
      if (a.copula) return s + (hasJong(s) ? '이라고!' : '라고!');
      const plain = conj(s, '다');
      return /싶$/.test(s) ? `${s}단 말이야앗!` : `${plain}고!`;
    }
  }
}

function momoOne(s, rand, once) {
  const a = s.a;
  const t = s.tags;
  const before = [];
  const after = [];
  let line = '';

  if (t.has('no') || t.has('dislike')) {
    if (once('iya')) return pick(rand, ['이—야—야다야다!! (엉덩이 흔들흔들)', '싫어~! 하기 싫어~! 이—야—야다야다!']);
  }
  if (t.has('angry') && once('shaa')) before.push(pick(rand, ['샤아아앗!!!', '샤앗!']));
  if (t.has('scared') && once('scared')) before.push(pick(rand, ['아이~ 무서워라!', '오오~ 무서워…']));
  if (t.has('surprised') && once('surprised')) before.push(pick(rand, ['엑!!', '게겟!']));
  if (t.has('greet') && once('greet')) before.push('어이!');

  if (/^잘 ?자/.test(s.body)) {
    line = '재워 줘라앗! 자장가도 불러라!';
  } else if (a.ok && !a.greet) {
    line = withPre(a, momoLast(a));
    if (a.mood === 'imp' && /칭찬/.test(s.body)) line = '칭찬해라앗!! 더… 더 칭찬해라!!';
  } else if (!a.greet) {
    line = `${s.body}! 내놔!`;
  }

  if ((t.has('sad') || t.has('tired')) && once('cry')) after.push(pick(rand, ['…업어 줘~…', '이 아름다운 눈물을 봐라!']));
  if ((t.has('hungry') || t.has('food')) && once('food')) after.push(pick(rand, ['맛있는 거 내놔!', '전부 다 먹고 싶다고!', '그거… 이리 내놔라앗!']));
  if (t.has('love') && once('cute')) after.push('…근데 이쪽이 더 귀엽~지?');
  if ((t.has('praise') || t.has('self') || t.has('happy')) && rand() < 0.6 && once('homero')) after.push(pick(rand, ['어때! 칭찬해라앗!', '봐라앗!', '박수~~!! 휘파람!! 환호!!']));
  if (t.has('thanks') && !/(고마|감사)/.test(s.body) && once('thanks')) after.push('흥, 당연하지!');
  if (/(고마|감사)/.test(s.body) && a.ok) line = withPre(a, '…흥. 고, 고맙긴 하다고!');
  if (t.has('work') && once('work')) after.push('그런 거… 할 리가 없잖아!');

  return momoStretch(dropSelf([...before, line, ...after].filter(Boolean).join(' ')));
}

export function momonga(list, rand) {
  const once = onceSet();
  return list.map((s) => momoOne(s, rand, once)).join(' ');
}
