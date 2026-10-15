import { sketch, redraw } from './sketch.js';
import { drawCharacter, installPatterns } from './art.js';
import { CHARACTERS, EXAMPLES, translate } from './translate.js';

const $ = (sel) => document.querySelector(sel);
const src = $('#src');
const strip = $('#strip');
const count = $('#count');
const toast = $('#toast');

installPatterns();

// 스프링 고리
const rings = $('.rings');
rings.innerHTML = '<i></i>'.repeat(18);

// 입력칸 위로 빼꼼 보이는 셋
$('.peek').innerHTML = ['chiikawa', 'hachiware', 'usagi'].map(drawCharacter).join('');

// 예시 문장
const chipColors = ['#f9c9d4', '#c4dbf3', '#f7e6a4', '#fbd2ad', '#d9cdee'];
$('#chips').innerHTML = EXAMPLES.map(
  (t, i) => `<button type="button" class="chip sk" data-fill="${chipColors[i % chipColors.length]}" data-radius="18" data-density="0.75">${t}</button>`,
).join('');
$('#chips').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  src.value = chip.textContent;
  update();
  src.focus();
});

// 캐릭터 칸
const rolls = Object.fromEntries(CHARACTERS.map((c) => [c.id, 0]));

strip.innerHTML = CHARACTERS.map(
  (c) => `
  <article class="koma sk ${c.layout}" data-char="${c.id}" data-fill="${c.panel}" data-density="0.55" data-radius="6" data-line-width="2.8" style="--c:${c.ink}">
    <div class="bubble sk" data-shape="bubble" data-paper="#fffefb" data-tail-x="${c.layout === 'wide' ? 34 : 62}" data-tail-dx="${c.layout === 'wide' ? -22 : -12}">
      <p class="said" id="said-${c.id}"></p>
    </div>
    <div class="who">
      ${drawCharacter(c.id)}
      <span class="name">${c.name}</span>
    </div>
    <div class="tools">
      <button type="button" class="tool" data-act="again" aria-label="${c.name} 말 다시 듣기">다시</button>
      <button type="button" class="tool" data-act="copy" aria-label="${c.name} 말 복사">복사</button>
    </div>
  </article>`,
).join('');

function render(id, animate) {
  const c = CHARACTERS.find((x) => x.id === id);
  const said = document.getElementById(`said-${id}`);
  const text = src.value.trim();
  const out = text ? translate(text, id, rolls[id]) : c.intro;
  said.dataset.raw = out;
  // 하아—ㅅ 같은 말이 줄바꿈으로 끊기지 않게 (복사할 때는 원문 그대로)
  said.textContent = out.replace(/([^\s])([—─~]+)/g, '$1\u2060$2\u2060');
  said.classList.toggle('empty', !text);
  const bubble = said.parentElement;
  redraw(bubble);
  if (animate) {
    bubble.classList.remove('talk');
    void bubble.offsetWidth;
    bubble.classList.add('talk');
  }
}

let timer;
function update() {
  count.textContent = `${src.value.length} / 300`;
  clearTimeout(timer);
  timer = setTimeout(() => {
    CHARACTERS.forEach((c) => render(c.id, false));
    const q = src.value.trim();
    const url = new URL(location.href);
    if (q) url.searchParams.set('t', q);
    else url.searchParams.delete('t');
    history.replaceState(null, '', url);
  }, 180);
}

src.addEventListener('input', update);

$('#clear').addEventListener('click', () => {
  src.value = '';
  update();
  src.focus();
});

let toastTimer;
function say(msg) {
  toast.textContent = msg;
  redraw(toast);
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1600);
}

strip.addEventListener('click', async (e) => {
  const btn = e.target.closest('.tool');
  if (!btn) return;
  const id = btn.closest('.koma').dataset.char;
  const c = CHARACTERS.find((x) => x.id === id);
  if (btn.dataset.act === 'again') {
    rolls[id] += 1;
    render(id, true);
  } else {
    const text = document.getElementById(`said-${id}`).dataset.raw;
    try {
      await navigator.clipboard.writeText(text);
      say(`${c.name} 말을 복사했어요`);
    } catch {
      say('복사하지 못했어요. 글을 길게 눌러 직접 복사해 주세요');
    }
  }
});

toast.classList.add('sk');
toast.dataset.paper = '#fffefb';
toast.dataset.fill = '#fbd0da';
toast.dataset.density = '0.6';
toast.dataset.radius = '18';

// 공유 링크로 들어오면 그 문장부터
const shared = new URL(location.href).searchParams.get('t');
if (shared) src.value = shared.slice(0, 300);

CHARACTERS.forEach((c) => render(c.id, false));
count.textContent = `${src.value.length} / 300`;

const ready = document.fonts?.ready ?? Promise.resolve();
ready.then(() => sketch());
sketch();
