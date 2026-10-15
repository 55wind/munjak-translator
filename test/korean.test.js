import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, conj, toHae, stemFromHae, sentences, toCasual, josa } from '../js/korean.js';

test('해체 → 어간', () => {
  const cases = {
    먹어: '먹', 배고파: '배고프', 귀여워: '귀엽', 몰라: '모르', 해: '하', 봐: '보', 줘: '주', 돼: '되',
    마셔: '마시', 졸려: '졸리', 배워: '배우', 슬퍼: '슬프', 커: '크', 가: '가', 고마워: '고맙', 배불러: '배부르',
  };
  for (const [hae, stem] of Object.entries(cases)) assert.equal(stemFromHae(hae), stem, hae);
});

test('어간 → 해체', () => {
  const cases = { 먹: '먹어', 배고프: '배고파', 귀엽: '귀여워', 모르: '몰라', 하: '해', 보: '봐', 주: '줘', 되: '돼', 마시: '마셔', 좋: '좋아', 아니: '아니야', 놀았: '놀았어' };
  for (const [stem, hae] of Object.entries(cases)) assert.equal(toHae(stem), hae, stem);
});

test('여러 어미 활용', () => {
  assert.equal(conj('먹', '다'), '먹는다');
  assert.equal(conj('가', '다'), '간다');
  assert.equal(conj('놀', '다'), '논다');
  assert.equal(conj('좋', '다'), '좋다');
  assert.equal(conj('배고프', '군'), '배고프군');
  assert.equal(conj('먹', '군'), '먹는군');
  assert.equal(conj('놀', '네'), '노네');
  assert.equal(conj('학생', '다', { copula: true }), '학생이다');
  assert.equal(conj('학생', '잖아', { copula: true }), '학생이잖아');
  assert.equal(conj('사과', '잖아', { copula: true }), '사과잖아');
  assert.equal(conj('하', 'ㄹ게'), '할게');
  assert.equal(conj('먹', 'ㄹ게'), '먹을게');
  assert.equal(conj('놀', 'ㄹ래'), '놀래');
  assert.equal(conj('놀', '습니다'), '놉니다');
  assert.equal(conj('먹', '습니다'), '먹습니다');
  assert.equal(conj('가', '습니다'), '갑니다');
});

test('문장 나누기', () => {
  assert.deepEqual(sentences('배고파!! 밥 먹자.'), [
    { body: '배고파', punct: '!!' },
    { body: '밥 먹자', punct: '.' },
  ]);
  assert.deepEqual(sentences('뭐 해?\n나는 자'), [
    { body: '뭐 해', punct: '?' },
    { body: '나는 자', punct: '' },
  ]);
});

test('문장 끝 분석', () => {
  const a = analyze('저는 학생입니다');
  assert.equal(a.stem, '학생');
  assert.ok(a.copula && a.polite);
  assert.equal(toCasual(a), '저는 학생이야');

  assert.equal(analyze('같이 놀자').mood, 'prop');
  assert.equal(analyze('내가 할게').mood, 'promise');
  assert.equal(analyze('뭐 먹을까', '?').mood, 'ques');
  assert.equal(analyze('도와줘').mood, 'imp');
  assert.equal(analyze('오늘 날씨 좋네').mood, 'exclaim');
  assert.equal(analyze('무서워요').stem, '무섭');
  assert.ok(analyze('숙제 다 했어').past);
  assert.equal(toCasual(analyze('내일 만나요')), '내일 만나');
  assert.equal(toCasual(analyze('고맙습니다')), '고마워');
  assert.equal(toCasual(analyze('빨리 오세요')), '빨리 와');
});

test('ㅋㅋ, ㅠㅠ 꼬리는 따로 둔다', () => {
  const a = analyze('시험 망쳤어 ㅠㅠ');
  assert.equal(a.stem, '망쳤');
  assert.equal(a.tail, 'ㅠㅠ');
  const b = analyze('웃겨ㅋㅋㅋ');
  assert.equal(b.tail, 'ㅋㅋㅋ');
});

test('조사', () => {
  assert.equal(josa('치이카와', '는', '는'.replace('는', '는')), '는');
  assert.equal(josa('랏코', '은', '는'), '는');
  assert.equal(josa('하치와레', '이', '가'), '가');
  assert.equal(josa('밥', '이', '가'), '이');
});
