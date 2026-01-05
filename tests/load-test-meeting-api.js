import http from 'k6/http';
import { check, group } from 'k6';

// Configuration
export const options = {
  stages: [
    { duration: '10s', target: 50 },    // ramp lên 50 user
    { duration: '10s', target: 100 },   // ramp lên 100 user
    { duration: '10s', target: 200 },   // ramp lên 200 user
    { duration: '30s', target: 200 },   // giữ 200 user
    { duration: '10s', target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate < 0.1'],      // < 10% lỗi
    http_req_duration: ['p(95) < 500'],   // p95 < 500ms
  },
};


// Constants
const API_URL = 'https://academihub.site/api/classrooms/meeting/token';
const JWT_SECRET = 'REPLACE_WITH_LONG_RANDOM_SECRET_MIN_32_CHARS';
// TODO: Generate a valid JWT token with the secret above for testing
// For now, using a test JWT
const JWT_TEST = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJiYW82NjY2NiIsInJvbGUiOiJTVFVERU5UIiwiaXNzIjoiZHVjIG5ndXllbiIsImV4cCI6MTc2NzU4OTM3MCwidXNlcklkIjoiN2EzOGJhZGUtZTViYS00ODZjLTkzYjAtNzJkM2MwYzE5NjAxIiwidXNlcm5hbWUiOiJiYW82NjY2NiJ9.Xt87QMv3ygeoFHFF4zH4cvnv4n33wvDzzLj5o5ztC5A';

const ROOM_CODES = [
  'room-001',
  'room-002',
  'room-003',
  'room-004',
  'room-005',
];

const USER_IDS = [
  'user-001',
  'user-002',
  'user-003',
  'user-004',
  'user-005',
];

const USER_NAMES = [
  'Nguyễn Văn A',
  'Trần Thị B',
  'Lê Văn C',
  'Phạm Thị D',
  'Hoàng Văn E',
];

export default function () {
  group('Meeting API - Token Creation', function () {
    // Select random room code, user ID, and user name
    const roomCode = ROOM_CODES[Math.floor(Math.random() * ROOM_CODES.length)];
    const userId = USER_IDS[Math.floor(Math.random() * USER_IDS.length)];
    const userName = USER_NAMES[Math.floor(Math.random() * USER_NAMES.length)];

    // Prepare request payload (required fields: roomCode, userId)
    const payload = JSON.stringify({
      roomCode: roomCode,
      userId: userId,
      userName: userName,
    });

    // Prepare headers
    const params = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TEST}`,
      },
      timeout: '10s',
    };

    // Make the POST request
    const response = http.post(API_URL, payload, params);

    // Validate response (focus on performance metrics, not business logic)
    const checks = check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    // Log response details for failed requests
    if (response.status !== 200) {
      console.log(`❌ Request failed | Status: ${response.status} | Room: ${roomCode} | User: ${userId} | Duration: ${response.timings.duration}ms`);
    } else {
      console.log(`✓ Request successful | Status: ${response.status} | Room: ${roomCode} | User: ${userId} | Duration: ${response.timings.duration}ms`);
    }
  });
}

// Lifecycle function: runs after all VUs have finished
// Using k6's default summary output
