import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translate, CHARACTERS } from '../js/translate.js';

const INPUTS = [
  '오늘 너무 배고파',
  '같이 라면 먹으러 갈래?',
  '시험 망쳤어…',
  '이거 진짜 맛있다!',
  '나 칭찬해 줘',
  '안녕하세요! 저는 학생입니다.',
  '회사 가기 싫어 ㅠㅠ',
  '무서워요… 어떡해',
  '그거 진짜 웃기다 ㅋㅋㅋ',
  '선생님 감사합니다',
  'hello 123',
  'ㅋㅋㅋㅋ',
  '!!!',
  '가',
];

test('모든 캐릭터가 어떤 입력에도 빈 말이나 undefined 없이 답한다', () => {
  for (const c of CHARACTERS) {
    for (const t of INPUTS) {
      for (let roll = 0; roll < 5; roll++) {
        const out = translate(t, c.id, roll);
        assert.ok(out.trim().length > 0, `${c.id} ${t}`);
        assert.doesNotMatch(out, /undefined|null|NaN/, `${c.id} ${t} → ${out}`);
      }
    }
  }
});

test('같은 입력·같은 횟수면 같은 답, 다시 누르면 바뀔 수 있다', () => {
  const t = '같이 라면 먹으러 갈래?';
  assert.equal(translate(t, 'chiikawa', 0), translate(t, 'chiikawa', 0));
  const outs = new Set([0, 1, 2, 3, 4, 5].map((r) => translate(t, 'chiikawa', r)));
  assert.ok(outs.size > 1);
});

test('치이카와는 문장으로 말하지 않고 낱말 앞부분만 따라 한다', () => {
  const out = translate('같이 라면 먹으러 갈래?', 'chiikawa', 0);
  assert.doesNotMatch(out, /먹으러 갈래/);
  assert.match(out, /라…\?/);
});

test('하치와레는 말끝을 끊거나 늘이고, 윗사람에게는 존댓말', () => {
  assert.match(translate('이거 진짜 맛있다!', 'hachiware', 0), /맛있[엇었]/);
  assert.match(translate('같이 놀자', 'hachiware', 0), /놀잣! 놀잣!/);
  assert.match(translate('선생님 감사합니다', 'hachiware', 0), /감사해/);
  assert.match(translate('무서워… 어떡해', 'hachiware', 1) + translate('무서워… 어떡해', 'hachiware', 2) + translate('무서워… 어떡해', 'hachiware', 3), /어떻게든/);
});

test('우사기는 우라·야하 계열 소리만 낸다', () => {
  for (const t of INPUTS) {
    const out = translate(t, 'usagi', 0);
    assert.match(out, /^[우라야하푸루후웅흐응이핫앗뿌르브기캬유먀걱로아슝가냐무·~…!?.♬\s—─꿀꺽깃으읏영차]+$/, `${t} → ${out}`);
  }
});

test('시사는 존댓말 끝을 늘인다', () => {
  assert.match(translate('오늘 너무 배고파', 'shisa', 0), /배고파요~/);
  assert.match(translate('내가 할게', 'shisa', 0), /제가 할게요~!!/);
});

test('쿠리만쥬는 몸짓과 숨소리로만 말한다', () => {
  const out = translate('오늘 회사에서 정말 힘든 일이 있었어', 'kurimanju', 0);
  assert.doesNotMatch(out, /회사/);
  assert.match(out, /\(.+\)/);
});

test('랏코는 부탁을 들어주고, 모몽가는 명령한다', () => {
  assert.match(translate('숙제 도와줘', 'rakko', 0), /도와주마/);
  assert.match(translate('숙제 도와줘', 'momonga', 0), /도와라앗!/);
  assert.match(translate('나 칭찬해 줘', 'momonga', 0), /칭찬해라앗/);
});
