# 碳循校园 EcoTrace - 环境自动安装脚本 (Windows)
# 检测 Node.js >= 18，缺失时从中国镜像自动下载安装

$ErrorActionPreference = 'Stop'
$NODE_MIRROR = "https://cdn.npmmirror.com/binaries/node"
$NODE_VERSION = "v22.16.0"
$REQUIRED_MAJOR = 18

function Write-Step { param($msg) Write-Host "  $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "  $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  $msg" -ForegroundColor Yellow }
function Write-Err  { param($msg) Write-Host "  $msg" -ForegroundColor Red }

# ─── 检测 Node.js ───
function Get-NodeVersion {
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCmd) {
        $ver = & node -v 2>$null
        if ($ver) {
            return @{ Path = $nodeCmd.Source; Version = $ver }
        }
    }
    $candidates = @(
        "$env:ProgramFiles\nodejs\node.exe",
        "${env:ProgramFiles(x86)}\nodejs\node.exe",
        "$env:LOCALAPPDATA\Programs\node\node.exe"
    )
    foreach ($p in $candidates) {
        if (Test-Path $p) {
            $ver = & $p -v 2>$null
            if ($ver) { return @{ Path = $p; Version = $ver } }
        }
    }
    return $null
}

function Test-NodeMajor {
    param($ver)
    if ($ver -match '^v(\d+)\.') {
        $major = [int]$Matches[1]
        return $major -ge $REQUIRED_MAJOR
    }
    return $false
}

# ─── 安装 Node.js ───
function Install-Node {
    Write-Step "Downloading Node.js $NODE_VERSION from China mirror..."
    Write-Step "Mirror: $NODE_MIRROR"

    $is64 = [Environment]::Is64BitOperatingSystem
    $arch = "x64"
    if (-not $is64) { $arch = "x86" }
    $filename = "node-$NODE_VERSION-win-$arch.msi"
    $url = "$NODE_MIRROR/$NODE_VERSION/$filename"
    $tmpFile = Join-Path $env:TEMP $filename

    # Download with retries
    $ok = $false
    for ($i = 1; $i -le 3; $i++) {
        try {
            Write-Step "Downloading... (attempt $i/3)"
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            $wc = New-Object System.Net.WebClient
            $wc.Headers.Add("User-Agent", "EcoTrace-Setup/1.0")
            $wc.DownloadFile($url, $tmpFile)
            $ok = $true
            break
        }
        catch {
            Write-Warn "Download failed: $($_.Exception.Message)"
            Start-Sleep -Seconds 3
        }
    }

    if (-not $ok) {
        Write-Warn "Mirror failed, trying official source..."
        $official = "https://nodejs.org/dist/$NODE_VERSION/$filename"
        try {
            Invoke-WebRequest -Uri $official -OutFile $tmpFile -UseBasicParsing
            $ok = $true
        }
        catch {
            Write-Err "Download failed. Please install Node.js >= 18 manually."
            Write-Err "Mirror: https://npmmirror.com/mirrors/node/"
            Write-Err "Official: https://nodejs.org/"
            return $false
        }
    }

    if (-not (Test-Path $tmpFile)) {
        Write-Err "File not found: $tmpFile"
        return $false
    }

    $sizeMB = [math]::Round((Get-Item $tmpFile).Length / 1MB, 1)
    Write-Ok "Downloaded ($sizeMB MB)"

    # Silent install
    Write-Step "Installing Node.js (silent mode)..."
    $logFile = Join-Path $env:TEMP "node-install.log"
    $proc = Start-Process msiexec.exe -ArgumentList "/i `"$tmpFile`" /qn /norestart /log `"$logFile`"" -Wait -PassThru -Verb RunAs

    if ($proc.ExitCode -ne 0) {
        Write-Err "Install failed (exit code: $($proc.ExitCode))"
        Write-Err "Log: $logFile"
        Write-Warn "Please right-click $tmpFile and Run as Administrator"
        return $false
    }

    Write-Ok "Node.js installed"

    # Refresh PATH
    $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$machinePath;$userPath"

    # Verify
    $nodeCheck = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCheck) {
        $newVer = & node -v 2>$null
        Write-Ok "Verified: Node.js $newVer"
        return $true
    }

    $defaultPath = "$env:ProgramFiles\nodejs\node.exe"
    if (Test-Path $defaultPath) {
        $newVer = & $defaultPath -v 2>$null
        Write-Ok "Verified: Node.js $newVer (restart terminal for PATH)"
        $env:Path = "$env:ProgramFiles\nodejs;$env:Path"
        return $true
    }

    Write-Warn "Installed but node not in PATH. Restart terminal and try again."
    return $false
}

# ─── Main ───
Write-Host ""
Write-Host "  🌿 EcoTrace Environment Setup" -ForegroundColor Green
Write-Host "  ─────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# 1. Check Node.js
$nodeInfo = Get-NodeVersion
if ($nodeInfo) {
    Write-Ok "Node.js: $($nodeInfo.Version)"
    $majorOk = Test-NodeMajor $nodeInfo.Version
    if (-not $majorOk) {
        Write-Warn "Version too old (need >= $REQUIRED_MAJOR), upgrading..."
        $installed = Install-Node
        if (-not $installed) { exit 1 }
    }
}
else {
    Write-Warn "Node.js not found, installing..."
    $installed = Install-Node
    if (-not $installed) { exit 1 }
}

# 2. Check .env
Write-Host ""
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Warn ".env not found, creating from .env.example..."
        Copy-Item ".env.example" ".env"
        Write-Warn "Please edit .env with your API keys, then re-run"
        notepad ".env"
        exit 1
    }
    else {
        Write-Err ".env and .env.example both missing"
        exit 1
    }
}

# Validate .env content
$envContent = Get-Content ".env" -Raw
$envOk = $true
$keys = @("TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN", "ZHIPUAI_API_KEY")
foreach ($key in $keys) {
    $pattern = "$key=.+"
    if ($envContent -notmatch $pattern) {
        Write-Warn ".env missing: $key"
        $envOk = $false
    }
}
if (-not $envOk) {
    Write-Err "Please edit .env with complete environment variables"
    notepad ".env"
    exit 1
}
Write-Ok ".env configured"

# 3. Start server
Write-Host ""
Write-Host "  ─────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""
Write-Ok "Starting demo server..."
Write-Host ""

node demo-server.mjs
