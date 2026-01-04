# Auto-generate mkcert certificates for current network IP
# Usage: .\setup-https.ps1

Write-Host "=== Auto HTTPS Setup with mkcert ===" -ForegroundColor Cyan

# 1. Check if mkcert is installed
$mkcertExists = Get-Command mkcert -ErrorAction SilentlyContinue
if (-not $mkcertExists) {
    Write-Host "Installing mkcert via Chocolatey..." -ForegroundColor Yellow
    
    $chocoExists = Get-Command choco -ErrorAction SilentlyContinue
    if (-not $chocoExists) {
        Write-Host "Installing Chocolatey first..." -ForegroundColor Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    }
    
    choco install mkcert -y
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    mkcert -install
    
    Write-Host "mkcert installed successfully!" -ForegroundColor Green
} else {
    Write-Host "mkcert already installed" -ForegroundColor Green
}

# 2. Detect current network IP
Write-Host ""
Write-Host "Detecting network IP..." -ForegroundColor Cyan
$networkIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.InterfaceAlias -notlike "*Loopback*" -and 
    $_.IPAddress -like "192.168.*"
} | Select-Object -First 1).IPAddress

if (-not $networkIP) {
    Write-Host "Could not detect 192.168.x.x IP. Using localhost only." -ForegroundColor Yellow
    $networkIP = "127.0.0.1"
}

Write-Host "Detected IP: $networkIP" -ForegroundColor Green

# 3. Generate certificate
Write-Host ""
Write-Host "Generating certificate for:" -ForegroundColor Cyan
Write-Host "  - localhost" -ForegroundColor White
Write-Host "  - 127.0.0.1" -ForegroundColor White
Write-Host "  - $networkIP" -ForegroundColor White

$certDir = $PSScriptRoot
$certFile = Join-Path $certDir "dev-cert.pem"
$keyFile = Join-Path $certDir "dev-cert-key.pem"

# Remove old certificates
if (Test-Path $certFile) { Remove-Item $certFile -Force }
if (Test-Path $keyFile) { Remove-Item $keyFile -Force }

# Generate new certificate
& mkcert -cert-file $certFile -key-file $keyFile localhost 127.0.0.1 "::1" $networkIP

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Certificate generated successfully!" -ForegroundColor Green
    Write-Host "  Location: $certDir" -ForegroundColor Gray
    Write-Host "  Key: dev-cert-key.pem" -ForegroundColor Gray
    Write-Host "  Cert: dev-cert.pem" -ForegroundColor Gray
    
    # Save current IP to file
    $ipFile = Join-Path $certDir ".current-ip.txt"
    $networkIP | Out-File -FilePath $ipFile -Encoding UTF8 -NoNewline
    
    Write-Host ""
    Write-Host "Saved current IP to .current-ip.txt" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run: npm run dev" -ForegroundColor Cyan
    Write-Host "Access via: https://$networkIP`:5173" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Failed to generate certificate" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
