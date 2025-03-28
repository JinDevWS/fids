// 앱 초기화용 컴포넌트

import VisibilityChangeListener from './VisibilityChangeListener';

export default function AppInit() {
  // cron 백그라운드 작업 호출
  fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/init`, {
    method: 'GET',
  })
    .then((r) => r.json())
    .then((result) => {
      console.log(result);
    });

  // 포그라운드 복귀 시 항공편 목록 갱신
  return <VisibilityChangeListener />;
}
