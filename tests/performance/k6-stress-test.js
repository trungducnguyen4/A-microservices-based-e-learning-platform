import http from 'k6/http';
import { check, sleep } from 'k6';

// Stress test configuration - push system to limits
export const options = {
  stages: [
    { duration: '1m', target: 100 },   // Warm up
    { duration: '2m', target: 200 },   // Normal load
    { duration: '3m', target: 400 },   // Stress level
    { duration: '2m', target: 600 },   // Breaking point
    { duration: '1m', target: 0 },     // Recovery
  ],
  thresholds: {
    http_req_duration: ['p(99)<1000'],  // 99% under 1s
    http_req_failed: ['rate<0.05'],     // 5% error threshold
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8888';

export default function () {
  const responses = http.batch([
    ['GET', `${BASE_URL}/actuator/health`],
    ['GET', `${BASE_URL}/api/users/profile`],
    ['GET', `${BASE_URL}/api/homework`],
    ['GET', `${BASE_URL}/api/schedules`],
  ]);

  responses.forEach((res, index) => {
    check(res, {
      [`request ${index} status is 2xx or 3xx or 401`]: (r) => 
        r.status >= 200 && r.status < 400 || r.status === 401,
    });
  });

  sleep(0.5);
}
