import http from 'k6/http';
import { check, group } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50 },
    { duration: '10s', target: 100 },
    { duration: '10s', target: 200 },
    { duration: '30s', target: 200 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate < 0.1'],
    http_req_duration: ['p(95) < 500'],
  },
};

// 👉 GỌI TRỰC TIẾP CLASSROOM SERVICE (SWARM)
// Nếu chạy k6 trong container cùng network:
const API_URL = 'http://13.211.125.143:4001/api/classrooms/meeting/token';

// Nếu chạy k6 trên EC2 và đã publish port:
// const API_URL = 'http://localhost:4001/api/classrooms/meeting/token';

const JWT_TEST = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJiYW82NjY2NiIsInJvbGUiOiJTVFVERU5UIiwiaXNzIjoiZHVjIG5ndXllbiIsImV4cCI6MTc2NzU4OTM3MCwidXNlcklkIjoiN2EzOGJhZGUtZTViYS00ODZjLTkzYjAtNzJkM2MwYzE5NjAxIiwidXNlcm5hbWUiOiJiYW82NjY2NiJ9.Xt87QMv3ygeoFHFF4zH4cvnv4n33wvDzzLj5o5ztC5A';

const ROOM_CODES = ['room-001', 'room-002', 'room-003', 'room-004', 'room-005'];
const USER_IDS = ['user-001', 'user-002', 'user-003', 'user-004', 'user-005'];
const USER_NAMES = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D', 'Hoàng Văn E'];

export default function () {
  group('ClassroomService - Meeting Token', function () {
    const payload = JSON.stringify({
      roomCode: ROOM_CODES[Math.floor(Math.random() * ROOM_CODES.length)],
      userId: USER_IDS[Math.floor(Math.random() * USER_IDS.length)],
      userName: USER_NAMES[Math.floor(Math.random() * USER_NAMES.length)],
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',

        // giả lập header từ API Gateway
        'Authorization': `Bearer ${JWT_TEST}`,
        'x-user-id': 'load-test-user',
        'x-user-role': 'STUDENT',
      },
      timeout: '10s',
    };

    const res = http.post(API_URL, payload, params);

    check(res, {
      'status is not 5xx': (r) => r.status < 500,
      'response time < 800ms': (r) => r.timings.duration < 800,
    });
  });
}
