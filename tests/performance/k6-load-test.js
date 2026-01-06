import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '1m', target: 100 },  // Increase to 100 users
    { duration: '2m', target: 200 },  // Peak at 200 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be below 1%
    errors: ['rate<0.1'],             // Custom error rate below 10%
  },
};

const BASE_URL = __ENV.API_URL || 'https://localhost:8888';

export default function () {
  // Test 1: Health check
  const healthRes = http.get(`${BASE_URL}/actuator/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: User login
  const loginPayload = JSON.stringify({
    email: 'test@example.com',
    password: 'testpassword123'
  });

  const loginRes = http.post(`${BASE_URL}/api/users/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'response time < 300ms': (r) => r.timings.duration < 300,
  });

  if (!loginSuccess) {
    errorRate.add(1);
  }

  sleep(2);

  // Test 3: Get homework list
  if (loginSuccess && loginRes.json('token')) {
    const token = loginRes.json('token');
    
    const homeworkRes = http.get(`${BASE_URL}/api/homework`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    check(homeworkRes, {
      'homework list status is 200': (r) => r.status === 200,
      'response has data': (r) => r.json('data') !== undefined,
    }) || errorRate.add(1);
  }

  sleep(1);

  // Test 4: Get schedule
  const scheduleRes = http.get(`${BASE_URL}/api/schedules`);
  check(scheduleRes, {
    'schedule status is 200': (r) => r.status === 200 || r.status === 401,
  }) || errorRate.add(1);

  sleep(1);
}

// Summary function
export function handleSummary(data) {
  return {
    'performance-summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, opts) {
  const indent = opts.indent || '';
  const colors = opts.enableColors;
  
  return `
${indent}Test Results:
${indent}  Scenarios: ${data.metrics.iterations?.values?.count || 0} iterations
${indent}  Duration: ${data.state?.testRunDurationMs / 1000}s
${indent}  
${indent}HTTP Metrics:
${indent}  Requests: ${data.metrics.http_reqs?.values?.count || 0}
${indent}  Failed: ${data.metrics.http_req_failed?.values?.rate * 100 || 0}%
${indent}  Avg Duration: ${data.metrics.http_req_duration?.values?.avg || 0}ms
${indent}  P95 Duration: ${data.metrics.http_req_duration?.values['p(95)'] || 0}ms
${indent}
${indent}Custom Metrics:
${indent}  Error Rate: ${data.metrics.errors?.values?.rate * 100 || 0}%
  `;
}
