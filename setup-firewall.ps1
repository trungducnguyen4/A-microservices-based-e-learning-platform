# Setup Windows Firewall for E-Learning Platform
# RUN AS ADMINISTRATOR

Write-Host "=== Setting up Windows Firewall Rules ===" -ForegroundColor Cyan

# Port 5173 - Vite Dev Server
Write-Host "`nAdding rule for Vite Dev Server (port 5173)..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "Vite Dev Server (5173)" `
        -Direction Inbound `
        -LocalPort 5173 `
        -Protocol TCP `
        -Action Allow `
        -Profile Private,Public `
        -ErrorAction Stop
    Write-Host "✓ Vite Dev Server rule added" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -like "*already exists*") {
        Write-Host "✓ Vite Dev Server rule already exists" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to add Vite rule: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Port 8888 - API Gateway
Write-Host "`nAdding rule for API Gateway (port 8888)..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "API Gateway (8888)" `
        -Direction Inbound `
        -LocalPort 8888 `
        -Protocol TCP `
        -Action Allow `
        -Profile Private,Public `
        -ErrorAction Stop
    Write-Host "✓ API Gateway rule added" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -like "*already exists*") {
        Write-Host "✓ API Gateway rule already exists" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to add API Gateway rule: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Port 8080 - UserService (optional, nếu cần access trực tiếp)
Write-Host "`nAdding rule for UserService (port 8080)..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "UserService (8080)" `
        -Direction Inbound `
        -LocalPort 8080 `
        -Protocol TCP `
        -Action Allow `
        -Profile Private,Public `
        -ErrorAction Stop
    Write-Host "✓ UserService rule added" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -like "*already exists*") {
        Write-Host "✓ UserService rule already exists" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to add UserService rule: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Port 4000 - ClassroomService (optional)
Write-Host "`nAdding rule for ClassroomService (port 4000)..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "ClassroomService (4000)" `
        -Direction Inbound `
        -LocalPort 4000 `
        -Protocol TCP `
        -Action Allow `
        -Profile Private,Public `
        -ErrorAction Stop
    Write-Host "✓ ClassroomService rule added" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -like "*already exists*") {
        Write-Host "✓ ClassroomService rule already exists" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to add ClassroomService rule: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Firewall rules have been configured for:" -ForegroundColor White
Write-Host "  • Vite Dev Server (5173)" -ForegroundColor White
Write-Host "  • API Gateway (8888)" -ForegroundColor White
Write-Host "  • UserService (8080)" -ForegroundColor White
Write-Host "  • ClassroomService (4000)" -ForegroundColor White

Write-Host "`nYou can now access from mobile:" -ForegroundColor Green
Write-Host "  Frontend: https://192.168.1.2:5173" -ForegroundColor Cyan
Write-Host "  API Gateway: http://192.168.1.2:8888" -ForegroundColor Cyan

Write-Host "`nTo remove these rules later, run:" -ForegroundColor Gray
Write-Host "  Remove-NetFirewallRule -DisplayName 'Vite Dev Server (5173)'" -ForegroundColor Gray
Write-Host "  Remove-NetFirewallRule -DisplayName 'API Gateway (8888)'" -ForegroundColor Gray
