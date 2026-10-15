// 캐릭터 그림 (팬아트). 모두 120×120 좌표계.
// 면은 색연필 빗금 패턴 + 종이 결 필터, 선은 살짝 흔들리는 사인펜 선.

const NS = 'http://www.w3.org/2000/svg';
const INK = '#2b2522';

// 빗금 패턴 색: [바탕, 빗금]
export const PALETTE = {
  white: ['#ffffff', '#eceef2'],
  shade: ['#ffffff', '#d6dde6'],
  blush: ['#f9d0d8', '#f0aebd'],
  cream: ['#fff8e6', '#f6e3b9'],
  creamshade: ['#fbeccb', '#efd39c'],
  hachiware: ['#b7d0dc', '#6f9cb2'],
  usagi: ['#fbf1d2', '#f2dea4'],
  usagishade: ['#f6e4b2', '#e9cc84'],
  earpink: ['#f8cfd5', '#efa9b4'],
  mane: ['#f9c8a4', '#ef9a63'],
  kuritop: ['#a87458', '#7d4e36'],
  scar: ['#d8ccbc', '#a69580'],
  sky: ['#dcedf8', '#a9cfe9'],
  nosepink: ['#f9c9cf', '#f19aa8'],
  // 제목 글자와 만화 칸에 쓰는 테마색
  chiikawa: ['#fde3e9', '#f4a9bc'],
  shisa: ['#fde2c8', '#f2a465'],
  kurimanju: ['#f4e1cc', '#c99467'],
  rakko: ['#d9f0e8', '#88c5b2'],
  momonga: ['#ebe4f8', '#b4a2dc'],
};

export function installPatterns() {
  const defs = document.querySelector('svg.defs defs');
  if (!defs || defs.querySelector('#hatch-white')) return;
  for (const [key, [base, ink]] of Object.entries(PALETTE)) {
    const p = document.createElementNS(NS, 'pattern');
    p.setAttribute('id', `hatch-${key}`);
    p.setAttribute('patternUnits', 'userSpaceOnUse');
    p.setAttribute('width', '6');
    p.setAttribute('height', '6');
    p.setAttribute('patternTransform', `rotate(${/shade/.test(key) ? 40 : -38})`);
    p.innerHTML = `<rect width="6" height="6" fill="${base}"/><rect width="2.6" height="6" fill="${ink}" opacity="0.7"/><rect x="3.6" width="1" height="6" fill="${ink}" opacity="0.3"/>`;
    defs.append(p);
  }
}

let n = 0;

const LN = `fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"`;
const ln = (d, w = 3.4, extra = '') => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;

// 칠한 면: 흰 바탕 + 빗금 + 종이 결, 그 위에 선
function part(d, color, { line = true, w = 3.4 } = {}) {
  return (
    `<path d="${d}" fill="#fff"/>` +
    `<path d="${d}" fill="url(#hatch-${color})" filter="url(#grain)"/>` +
    (line ? ln(d, w) : '')
  );
}

// 둥근 몸 오른쪽 아래에 초승달 모양 그늘
function shading(d, color = 'shade', { dx = 7, dy = 9 } = {}) {
  const id = `sh${++n}`;
  return (
    `<mask id="${id}"><path d="${d}" fill="#fff"/><path d="${d}" transform="translate(${-dx} ${-dy})" fill="#000"/></mask>` +
    `<path d="${d}" mask="url(#${id})" fill="url(#hatch-${color})" filter="url(#grain)" opacity="0.85"/>`
  );
}

// 세로로 긴 까만 눈 + 비스듬한 흰 반짝임
function eyes(x1, x2, y, { rx = 5, ry = 6.2 } = {}) {
  const e = (x) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${INK}"/>` +
    `<ellipse cx="${x - rx * 0.25}" cy="${y - ry * 0.35}" rx="${rx * 0.42}" ry="${ry * 0.3}" transform="rotate(-35 ${x - rx * 0.25} ${y - ry * 0.35})" fill="#fff"/>`;
  return e(x1) + e(x2);
}

function cheeks(x1, x2, y, { rx = 8.5, ry = 5.4 } = {}) {
  const c = (x) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#hatch-blush)" filter="url(#grain)"/>` +
    ln(`M${x - 3.6} ${y + 1.8} l-1 -3.6 M${x} ${y + 1.8} l-1 -3.6 M${x + 3.6} ${y + 1.8} l-1 -3.6`, 1.8);
  return c(x1) + c(x2);
}

// 고양이 입 ω + 살짝 벌린 입 (안은 흰색)
function catMouth(cx, y, { open = true, chin = false, s = 1 } = {}) {
  const w = 5 * s;
  return (
    (open ? `<path d="M${cx - 3.2 * s} ${y + 1} Q${cx} ${y + 8 * s} ${cx + 3.2 * s} ${y + 1}Z" fill="#fff" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>` : '') +
    ln(`M${cx - w * 2} ${y - 1} Q${cx - w} ${y + 4 * s} ${cx} ${y} Q${cx + w} ${y + 4 * s} ${cx + w * 2} ${y - 1}`, 2.6) +
    (chin ? ln(`M${cx - 2.5} ${y + 11 * s} h5`, 2.2) : '')
  );
}

function svg(inner, label) {
  return `<svg viewBox="0 0 120 120" role="img" aria-label="${label}" xmlns="${NS}"><g filter="url(#wobble)">${inner}</g></svg>`;
}

const HEAD = 'M60 30 C88 30 106 48 106 72 C106 94 86 106 60 106 C34 106 14 94 14 72 C14 48 32 30 60 30Z';

const DRAW = {
  chiikawa() {
    const ear = (x, flip) =>
      part(`M${x - 12} 46 C${x - 14} 24 ${x + 14} 24 ${x + 12} 46Z`, 'white') +
      ln(`M${x - 5 * flip} 40 C${x - 4 * flip} 33 ${x + 3 * flip} 33 ${x + 4 * flip} 38`, 2.2);
    return svg(
      ear(32, 1) +
        ear(88, -1) +
        part(HEAD, 'white', { line: false }) +
        shading(HEAD) +
        ln(HEAD) +
        ln('M39 55 h7 M74 55 h7', 2.6) +
        eyes(43, 77, 67, { rx: 5.6, ry: 6.8 }) +
        cheeks(27, 93, 80) +
        catMouth(60, 79, { chin: true }),
      '치이카와',
    );
  },

  hachiware() {
    const id = `hw${++n}`;
    // 머리 + 고양이 귀 실루엣 (귀와 머리 사이에 선이 없다)
    const sil =
      'M60 106 C34 106 14 94 14 72 C14 58 17 48 23 41 L25 18 Q26 11 32 14 L47 30 C55 28 65 28 73 30 L88 14 Q94 11 95 18 L97 41 C103 48 106 58 106 72 C106 94 86 106 60 106Z';
    const cap = 'M0 56 C18 44 40 44 56 51 L60 56 L64 51 C80 44 102 44 120 56 L120 0 L0 0Z';
    return svg(
      part(sil, 'white', { line: false }) +
        `<clipPath id="${id}"><path d="${sil}"/></clipPath>` +
        `<g clip-path="url(#${id})"><path d="${cap}" fill="url(#hatch-hachiware)" filter="url(#grain)"/>` +
        ln('M0 56 C18 44 40 44 56 51 L60 56 L64 51 C80 44 102 44 120 56', 3) +
        `</g>` +
        shading(HEAD) +
        ln(sil) +
        `<circle cx="41" cy="60" r="1.6" fill="${INK}"/><circle cx="79" cy="60" r="1.6" fill="${INK}"/>` +
        eyes(42, 78, 71) +
        cheeks(27, 93, 82) +
        catMouth(60, 83, { chin: true }),
      '하치와레',
    );
  },

  usagi() {
    const head = 'M60 36 C88 36 106 54 106 76 C106 96 86 108 60 108 C34 108 14 96 14 76 C14 54 32 36 60 36Z';
    return svg(
      part('M46 42 C38 28 35 10 41 5 C48 0 56 18 58 40', 'usagi') +
        part('M58 40 C58 20 62 3 70 4 C78 5 74 26 70 42', 'usagi') +
        `<path d="M45 34 C41 24 40 14 43 10" stroke="#efa9b4" stroke-width="4.5" stroke-linecap="round" fill="none"/>` +
        `<path d="M63 33 C63 22 65 12 68 10" stroke="#efa9b4" stroke-width="4.5" stroke-linecap="round" fill="none"/>` +
        part(head, 'usagi', { line: false }) +
        shading(head, 'usagishade') +
        ln(head) +
        ln('M27 66 C29 54 36 48 45 48', 3) +
        ln('M75 48 C84 48 91 54 93 66', 3) +
        eyes(45, 75, 75, { rx: 4.6, ry: 5.4 }) +
        cheeks(28, 92, 86) +
        ln('M51 85 Q54.5 89.5 58 85.5 Q61.5 89.5 65 85.5 Q66 88 68 86', 2.6) +
        ln('M55 89.5 Q59 95 64 90', 2.4),
      '우사기',
    );
  },

  shisa() {
    const head = 'M60 32 C88 32 104 50 104 72 C104 94 86 106 60 106 C34 106 16 94 16 72 C16 50 32 32 60 32Z';
    // 옆 갈기: 몽글몽글한 주황 덩어리 세 개씩
    const maneL = 'M26 40 C14 38 8 48 14 56 C4 60 4 72 13 76 C6 84 12 96 24 92 L30 70Z';
    const maneR = 'M94 40 C106 38 112 48 106 56 C116 60 116 72 107 76 C114 84 108 96 96 92 L90 70Z';
    const brow = (x, f) =>
      `<path d="M${x - 7 * f} 60 C${x - 9 * f} 52 ${x - 2 * f} 48 ${x + 3 * f} 51 C${x + 8 * f} 49 ${x + 10 * f} 55 ${x + 6 * f} 59 C${x + 2 * f} 57 ${x - 3 * f} 57 ${x - 7 * f} 60Z" fill="url(#hatch-mane)" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>` +
      ln(`M${x - 2 * f} 55 q${2 * f} -3 ${4 * f} 0`, 1.8);
    return svg(
      part(maneL, 'mane') +
        part(maneR, 'mane') +
        ln('M12 58 q5 1 7 -1 M12 75 q5 1 7 -1 M108 58 q-5 1 -7 -1 M108 75 q-5 1 -7 -1', 2) +
        part('M30 42 L33 22 Q34 18 38 21 L50 33', 'cream') +
        part('M90 42 L87 22 Q86 18 82 21 L70 33', 'cream') +
        part(head, 'cream', { line: false }) +
        shading(head, 'creamshade') +
        ln(head) +
        brow(42, 1) +
        brow(78, -1) +
        eyes(43, 77, 71, { rx: 4.6, ry: 5.6 }) +
        cheeks(28, 92, 82) +
        catMouth(60, 82, { open: false, s: 0.9 }) +
        ln('M58 79 h4', 2.4),
      '시사',
    );
  },

  kurimanju() {
    const id = `km${++n}`;
    const head = 'M60 30 C88 30 106 48 106 72 C106 94 86 106 60 106 C34 106 14 94 14 72 C14 48 32 30 60 30Z';
    // 밤만쥬 윗면: 반들반들 구운 갈색 모자
    const top = 'M28 44 C26 26 44 18 62 18 C80 18 96 26 92 44 C80 50 40 50 28 44Z';
    return svg(
      part('M18 52 a6 6 0 1 1 6 -9', 'cream', { w: 3 }) +
        part('M102 52 a6 6 0 1 0 -6 -9', 'cream', { w: 3 }) +
        part(head, 'cream', { line: false }) +
        shading(head, 'creamshade') +
        ln(head) +
        part(top, 'kuritop') +
        `<path d="M44 27 q8 -4 16 -3" stroke="#fff3e0" stroke-width="3" stroke-linecap="round" fill="none" opacity=".8"/>` +
        `<ellipse cx="46" cy="70" rx="3.6" ry="4.2" fill="${INK}"/><ellipse cx="74" cy="70" rx="3.6" ry="4.2" fill="${INK}"/>` +
        `<circle cx="45" cy="68.5" r="1.3" fill="#fff"/><circle cx="73" cy="68.5" r="1.3" fill="#fff"/>` +
        `<ellipse cx="60" cy="72" rx="5.5" ry="3.8" fill="url(#hatch-nosepink)" stroke="${INK}" stroke-width="2"/>` +
        cheeks(30, 90, 76, { rx: 8, ry: 5 }) +
        ln('M56 80 q4 3 8 0', 2.4) +
        `<path d="M57.5 82 Q60 87 62.5 82Z" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`,
      '쿠리만쥬',
    );
  },

  rakko() {
    const head = 'M60 22 C88 22 106 42 106 66 C106 90 86 104 60 104 C34 104 14 90 14 66 C14 42 32 22 60 22Z';
    // 털 느낌: 끊어진 윤곽선, 수리검 모양 흉터, 목에 두른 흰 망토
    const star = 'M38 34 L42 42 L51 41 L44 47 L47 56 L39 50 L31 54 L35 46 L28 40 L36 41Z';
    const cape = 'M14 82 C30 96 90 96 106 82 L110 96 C92 112 28 112 10 96Z';
    const sleepy = (x) =>
      `<ellipse cx="${x}" cy="64" rx="7.5" ry="4.6" fill="#fff" stroke="${INK}" stroke-width="2.6"/>` +
      `<path d="M${x - 7.5} 64 A7.5 4.6 0 0 0 ${x + 7.5} 64Z" fill="${INK}"/>` +
      `<ellipse cx="${x + 1.5}" cy="66" rx="1.6" ry="1" fill="#fff"/>`;
    return svg(
      `<path d="M15 56 a7 7 0 1 1 3 -12Z" fill="${INK}"/><path d="M105 56 a7 7 0 1 0 -3 -12Z" fill="${INK}"/>` +
        `<path d="${head}" fill="#fff"/><path d="${head}" fill="url(#hatch-cream)" filter="url(#grain)"/>` +
        shading(head, 'creamshade') +
        ln(head, 3.4, 'stroke-dasharray="5.5 6"') +
        part(star, 'scar', { w: 2.4 }) +
        sleepy(46) +
        sleepy(74) +
        cheeks(30, 90, 74, { rx: 8, ry: 4.8 }) +
        ln('M56 75 q4 3 8 0', 2.4) +
        `<path d="M57 77 Q60 83 63 77Z" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
        part(cape, 'white') +
        ln('M38 98 l1 7 M60 100 v7 M82 98 l-1 7', 1.8),
      '랏코',
    );
  },

  momonga() {
    const head = 'M60 32 C88 32 104 50 104 72 C104 94 86 106 60 106 C34 106 16 94 16 72 C16 50 32 32 60 32Z';
    // 크고 복슬복슬한 하늘색 꼬리가 등 뒤로
    const tail = 'M70 36 C80 10 116 8 118 44 C120 76 106 98 90 106 C102 84 104 62 94 48 C88 40 78 36 70 36Z';
    const smug = (x) =>
      `<path d="M${x - 8} 69 L${x + 8} 69 A8 6 0 0 1 ${x - 8} 69Z" fill="${INK}"/>` +
      `<ellipse cx="${x - 1}" cy="71.5" rx="3.4" ry="1.5" fill="#fff"/>` +
      ln(`M${x - 9.5} 68.5 L${x + 9.5} 68.5`, 2.8);
    return svg(
      part(tail, 'sky') +
        ln('M96 22 l3 -5 M108 26 l5 -3 M115 40 l5 -1 M116 58 l5 1 M112 76 l4 3', 2) +
        part('M22 50 C14 36 22 22 34 24 C42 26 46 32 46 38', 'white') +
        part('M98 50 C106 36 98 22 86 24 C78 26 74 32 74 38', 'white') +
        `<path d="M25 44 C22 36 27 30 34 30 C38 31 40 35 40 38Z" fill="url(#hatch-sky)"/>` +
        `<path d="M95 44 C98 36 93 30 86 30 C82 31 80 35 80 38Z" fill="url(#hatch-sky)"/>` +
        part(head, 'white', { line: false }) +
        shading(head) +
        ln(head) +
        smug(43) +
        smug(77) +
        `<ellipse cx="60" cy="76" rx="5" ry="3.4" fill="url(#hatch-sky)" stroke="${INK}" stroke-width="1.8"/>` +
        cheeks(27, 93, 83, { rx: 8, ry: 4.8 }) +
        ln('M55 83 q2.5 3 5 0 q2.5 3 5 0', 2.4),
      '모몽가',
    );
  },
};

export function drawCharacter(id) {
  return DRAW[id]();
}
