import { initServerJobs } from '@/lib/startServerJobs';

// 백그라운드 작업 시작하는 함수 호출
initServerJobs();

export async function GET() {
  return Response.json({ started: true });
}
