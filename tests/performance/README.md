# Performance Testing với k6

## Cài đặt k6

### Windows
```powershell
choco install k6
```

Hoặc download từ: https://k6.io/docs/get-started/installation/

### Linux/macOS
```bash
brew install k6
```

## Chạy Performance Tests

### Load Test (200 users đồng thời)
```bash
k6 run k6-load-test.js
```

### Stress Test (lên đến 600 users)
```bash
k6 run k6-stress-test.js
```

### Custom configuration
```bash
# Chỉ định API URL
k6 run -e API_URL=http://your-server:8888 k6-load-test.js

# Xuất kết quả ra file JSON
k6 run --out json=results.json k6-load-test.js
```

## Metrics quan trọng

- **http_req_duration**: Thời gian phản hồi
  - Mục tiêu: p(95) < 500ms
  - p(95) < 300ms là excellent
  
- **http_req_failed**: Tỷ lệ request thất bại
  - Mục tiêu: < 1%
  
- **http_reqs**: Số request/giây
  - Mục tiêu: > 200 req/s

## Kết quả mong đợi

### Load Test
- 200 concurrent users
- < 300ms average response time
- < 1% error rate

### Stress Test
- Tìm breaking point của hệ thống
- Kiểm tra recovery sau peak load
