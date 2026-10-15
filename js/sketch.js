// 손으로 그린 듯한 테두리와 색연필 빗금을 요소 뒤에 깔아 준다.
// <div class="sk" data-fill="#F8B9C6" data-shape="bubble"> … </div>
import { hash, rng } from './util.js';

const NS = 'http://www.w3.org/2000/svg';
let uid = 0;

function el(name, attrs = {}) {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

// 둥근 사각형 둘레를 따라 점을 찍고 조금씩 흔든다.
function outlinePoints(w, h, { radius = 14, jitter = 1.6, tail = null, rand }) {
  const r = Math.min(radius, w / 2, h / 2);
  const pts = [];
  const step = 26;
  const push = (x, y) => pts.push([x + (rand() - 0.5) * jitter * 2, y + (rand() - 0.5) * jitter * 2]);
  const edge = (x1, y1, x2, y2) => {
    const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / step));
    for (let i = 0; i < n; i++) push(x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n);
  };
  const corner = (cx, cy, a0) => {
    for (let i = 0; i < 3; i++) {
      const a = a0 + (Math.PI / 2) * (i / 3);
      push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
  };
  edge(r, 0, w - r, 0);
  corner(w - r, r, -Math.PI / 2);
  edge(w, r, w, h - r);
  corner(w - r, h - r, 0);
  if (tail) {
    // 말풍선 꼬리: 아래 변에서 캐릭터 쪽으로
    const tx = Math.min(Math.max(tail.x, r + 18), w - r - 18);
    edge(w - r, h, tx + 14, h);
    pts.push([tx + 14, h]);
    pts.push([tx + tail.dx, h + tail.len]);
    pts.push([tx - 6, h]);
    edge(tx - 6, h, r, h);
  } else edge(w - r, h, r, h);
  corner(r, h - r, Math.PI / 2);
  edge(0, h - r, 0, r);
  corner(r, r, Math.PI);
  return pts;
}

// 닫힌 Catmull-Rom 곡선 → SVG path
function smooth(pts, sharp = new Set()) {
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    if (sharp.has(i) || sharp.has((i + 1) % n)) {
      d += ` L${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
      continue;
    }
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}

// 연필로 한 번에 그은 듯: 시작점이 살짝 어긋나게 열린 선
function strokePath(pts, rand) {
  const n = pts.length;
  const start = Math.floor(rand() * n);
  const seq = [];
  for (let i = 0; i <= n + 1; i++) seq.push(pts[(start + i) % n]);
  let d = `M${seq[0][0].toFixed(1)},${seq[0][1].toFixed(1)}`;
  for (let i = 0; i < seq.length - 1; i++) {
    const p0 = seq[Math.max(0, i - 1)];
    const p1 = seq[i];
    const p2 = seq[i + 1];
    const p3 = seq[Math.min(seq.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

// 색연필 빗금: 비스듬한 짧은 선을 촘촘히, 길이와 진하기를 조금씩 다르게
function hatch(w, h, { angle = -38, gap = 5, color, opacity = 0.8, rand, width = 2.2 }) {
  const g = el('g', { stroke: color, 'stroke-linecap': 'round', fill: 'none' });
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  const nx = -dy;
  const ny = dx;
  const diag = Math.hypot(w, h);
  const cx = w / 2;
  const cy = h / 2;
  const layers = [0.45, 0.7, 1].map((o) => ({ o, d: '' }));
  for (let t = -diag / 2; t <= diag / 2; t += gap * (0.7 + rand() * 0.6)) {
    const half = diag / 2;
    const a0 = -half + rand() * diag * 0.12;
    const a1 = half - rand() * diag * 0.12;
    const ox = cx + nx * t;
    const oy = cy + ny * t;
    const x1 = ox + dx * a0;
    const y1 = oy + dy * a0;
    const x2 = ox + dx * a1;
    const y2 = oy + dy * a1;
    const bend = (rand() - 0.5) * 4;
    const mx = (x1 + x2) / 2 + nx * bend;
    const my = (y1 + y2) / 2 + ny * bend;
    layers[Math.floor(rand() * 3)].d += `M${x1.toFixed(1)},${y1.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
  }
  for (const { o, d } of layers) if (d) g.append(el('path', { d, 'stroke-width': width * (0.8 + o * 0.4), opacity: opacity * o }));
  return g;
}

function draw(host) {
  const w = host.clientWidth;
  const h = host.clientHeight;
  if (!w || !h) return;
  const key = host.dataset.skKey || (host.dataset.skKey = String(++uid));
  const rand = rng(hash(key + (host.dataset.seed || '')));
  const shape = host.dataset.shape || 'box';
  const fill = host.dataset.fill;
  const line = host.dataset.line || 'var(--graphite)';
  const lineWidth = Number(host.dataset.lineWidth || 2.4);
  const radius = Number(host.dataset.radius || (shape === 'bubble' ? 26 : 10));
  const tail = shape === 'bubble' ? { x: Number(host.dataset.tailX || 40), dx: Number(host.dataset.tailDx || -10), len: 18 } : null;

  let svg = host.querySelector(':scope > svg.sk-layer');
  if (!svg) {
    svg = el('svg', { class: 'sk-layer', 'aria-hidden': 'true' });
    host.prepend(svg);
  }
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('width', w);
  svg.setAttribute('height', h);
  svg.replaceChildren();

  const pts = outlinePoints(w, h, { radius, jitter: shape === 'bubble' ? 1.8 : 1.3, tail, rand });
  const body = smooth(pts);
  const clipId = `skc${key}`;
  const clip = el('clipPath', { id: clipId });
  clip.append(el('path', { d: body }));
  svg.append(clip);

  if (host.dataset.paper) svg.append(el('path', { d: body, fill: host.dataset.paper }));
  if (fill) {
    const layer = el('g', { 'clip-path': `url(#${clipId})`, filter: 'url(#grain)' });
    const density = Number(host.dataset.density || 1);
    layer.append(hatch(w, h + (tail ? 20 : 0), { color: fill, gap: 3.6 / density, opacity: 0.9, rand, angle: -42 + rand() * 8, width: 2.6 }));
    // 다른 방향으로 한 번 더 살살 칠한다
    layer.append(hatch(w, h, { color: fill, gap: 7 / density, opacity: 0.35, rand, angle: 28 + rand() * 10, width: 1.8 }));
    svg.append(layer);
  }
  if (line !== 'none') {
    const ink = el('g', { fill: 'none', stroke: line, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', filter: 'url(#graphite)' });
    ink.append(el('path', { d: strokePath(pts, rand), 'stroke-width': lineWidth }));
    const pts2 = pts.map(([x, y]) => [x + (rand() - 0.5) * 1.6, y + (rand() - 0.5) * 1.6]);
    ink.append(el('path', { d: strokePath(pts2, rand), 'stroke-width': lineWidth * 0.45, opacity: 0.55 }));
    svg.append(ink);
  }
}

const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver((entries) => entries.forEach((e) => draw(e.target))) : null;

export function sketch(root = document) {
  root.querySelectorAll('.sk').forEach((host) => {
    if (host.dataset.skOn) return draw(host);
    host.dataset.skOn = '1';
    draw(host);
    ro?.observe(host);
  });
}

export function redraw(host) {
  draw(host);
}
