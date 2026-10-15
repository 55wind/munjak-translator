// 문장에서 감정·상황을 읽는다. 캐릭터는 이 결과를 보고 소리와 말끝을 고른다.

const LEXICON = {
  hungry: /배고프|배고파|배고픈|배가 고|출출|허기|굶|꼬르륵/,
  food: /밥|라면|먹|맛있|맛나|맛없|간식|과자|빵|케이크|고기|치킨|피자|(^|[^어])떡|디저트|아이스크림|커피|음식|요리|점심|저녁|야식|만두|푸딩|도넛|떡볶이|초밥|햄버거|짜장|국수|우동|카레|오므라이스|샌드위치|쿠키|초콜릿|사탕|젤리|과일|딸기|군밤|만쥬|빙수|마카롱|탕후루/,
  drink: /(^|\s)술|술집|음주|맥주|소주|와인|한잔|한 잔|건배|막걸리|하이볼|사케/,
  tired: /피곤|졸려|졸리|졸린|지쳤|지친|지쳐|녹초|쉬고 ?싶|자고 ?싶|월요일|야근|힘이 없|기운이 없|귀찮/,
  sleep: /잘 ?자|굿나잇|자러|잠이|잠을|낮잠|이불|침대/,
  sad: /슬퍼|슬프|슬픈|우울|눈물|울고|울었|울어|울컥|ㅠ|ㅜ|속상|서운|외로|그리워|보고 ?싶|아파|아프|망했|망쳤|실패|떨어졌|헤어|힘들|괴로|상처|불쌍/,
  angry: /화나|화가|화난|짜증|열받|빡치|빡쳐|미워|최악|어이없|억울|그만해|그만 해|분하|못 참|짜증나/,
  scared: /무서|무섭|겁나|겁이|두려|떨려|불안|걱정|큰일|위험|도망|살려|괴물|귀신|어떡해|어떻게 해|어쩌지|어떡하지/,
  surprised: /헐|대박|깜짝|놀라|놀랐|설마|말도 안|세상에|어머|헉|와우|우와|진짜로\?|정말로\?/,
  happy: /좋아|좋다|좋은|좋네|행복|신나|신난|신났|기뻐|기쁘|기쁜|최고|재밌|재미있|즐거|즐겁|설레|야호|ㅋㅋ|ㅎㅎ|만세|성공|합격|이겼|선물|축하|다행|럭키|됐다/,
  love: /사랑|귀여|귀엽|예쁘|예뻐|이뻐|이쁘|좋아해|애정|하트|♡|❤|소중/,
  praise: /잘했|잘 했|대단|멋지|멋져|멋있|훌륭|천재|똑똑|칭찬|잘한다|잘하네|최고야|짱/,
  thanks: /고마|감사|땡큐|고맙/,
  sorry: /미안|죄송|잘못했|용서/,
  greet: /안녕|반가|하이|ㅎㅇ|어서 ?와|좋은 아침|굿모닝|오랜만/,
  bye: /잘 ?가|바이|또 ?봐|내일 ?봐|다음에 ?봐|안녕히/,
  work: /일하|일해|일을|회사|출근|퇴근|알바|공부|숙제|시험|과제|업무|회의|마감|학교|학원|보고서|토벌|풀 ?뽑/,
  money: /돈|용돈|월급|비싸|싸다|가격|지갑|부자|가난|저금/,
  play: /놀자|놀러|놀아|놀고|게임|산책|여행|소풍|캠핑|노래|춤|파티|축제/,
  want: /싶어|싶다|싶은|갖고 ?싶|원해|해 ?줘|해줘|사 ?줘|줘$/,
  self: /(^|\s)(나|내가|난|나는|내|저|제가|저는|전)(\s|$)/,
};

export function readMood(body, punct = '') {
  const tags = new Set();
  for (const [k, re] of Object.entries(LEXICON)) if (re.test(body)) tags.add(k);
  if (/^(응|어|네|예|그래|좋아|오케이|ㅇㅇ|ㅇㅋ|알겠|알았|콜)/.test(body)) tags.add('yes');
  if (/^(아니|싫어|안 ?돼|못 ?해|ㄴㄴ|노노)/.test(body)) tags.add('no');
  if (/싫어|싫다|싫은|싫음|싫거든/.test(body)) tags.add('dislike');
  if (/(않|안 |못 |없어|없다|없네|싫)/.test(body)) tags.add('neg');
  if (punct.includes('?')) tags.add('ask');
  if (punct.includes('!')) tags.add('bang');
  if (/…|\.\.\./.test(punct)) tags.add('trail');
  // 맛있다·좋다가 부정이면 반대로
  if (tags.has('neg') && tags.has('happy') && /(안 ?좋|좋지 ?않|재미없|맛없)/.test(body)) {
    tags.delete('happy');
    tags.add('sad');
  }
  return tags;
}

// 대표 감정 하나 (우선순위 순)
const ORDER = ['scared', 'angry', 'sad', 'dislike', 'hungry', 'tired', 'surprised', 'thanks', 'sorry', 'praise', 'love', 'greet', 'bye', 'happy', 'drink', 'food', 'sleep', 'work', 'play', 'yes', 'no'];

export function mainMood(tags) {
  for (const k of ORDER) if (tags.has(k)) return k;
  if (tags.has('ask')) return 'ask';
  if (tags.has('bang')) return 'bang';
  return 'plain';
}
