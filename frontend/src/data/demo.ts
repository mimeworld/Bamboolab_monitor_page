export type PrintRecord = {
  name: string;
  user: string;
  date: string;
  duration: string;
  grams: number;
  status: '완료' | '출력 중' | '실패';
  color: string;
};

// API 연동 전 레이아웃을 확인하기 위한 고정 미리보기 데이터입니다.
export const demoPrints: PrintRecord[] = [
  { name: '데스크 케이블 홀더', user: '민지 김', date: '오늘, 09:42', duration: '2시간 14분', grams: 38.4, status: '완료', color: '#75bca3' },
  { name: '미니 화분 · set of 3', user: '현우 박', date: '오늘, 08:16', duration: '1시간 08분', grams: 24.1, status: '완료', color: '#d7a36b' },
  { name: '카메라 마운트 v2', user: '지금 출력 중', date: '오늘, 10:25', duration: '1시간 32분 남음', grams: 61.8, status: '출력 중', color: '#9da9e6' },
  { name: '기어박스 프로토타입', user: '준서 이', date: '어제, 16:38', duration: '3시간 42분', grams: 92.6, status: '완료', color: '#c78f9c' },
  { name: '스냅핏 테스트', user: '서연 최', date: '어제, 14:02', duration: '28분', grams: 8.2, status: '실패', color: '#c78f9c' },
];
