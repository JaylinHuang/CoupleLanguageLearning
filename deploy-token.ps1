# Jaylin_love_Erika - Vercel deploy via Token (works when "vercel login" fails on Chinese Windows usernames)
#
# Step 1: Open https://vercel.com/account/tokens in browser
# Step 2: Create Token -> name: Jaylin_love_Erika -> Full Account -> No Expiration -> Copy token
# Step 3: Run this script:
#   .\deploy-token.ps1 -Token "your_token_here"
#
# Or set env var first:
#   $env:VERCEL_TOKEN="your_token_here"
#   .\deploy-token.ps1

param(
    [string]$Token = $env:VERCEL_TOKEN
)

if (-not $Token -or $Token -eq "YOUR_TOKEN") {
    Write-Host "=== Token required ===" -ForegroundColor Red
    Write-Host ""
    Write-Host "1. Open https://vercel.com/account/tokens in your browser" -ForegroundColor Yellow
    Write-Host "2. Create Token -> name: Jaylin_love_Erika -> Full Account -> No Expiration" -ForegroundColor Yellow
    Write-Host "3. Copy the token, then run:" -ForegroundColor Yellow
    Write-Host '   .\deploy-token.ps1 -Token "paste_token_here"' -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Why: npx vercel login fails when Windows username/path contains Chinese characters." -ForegroundColor Gray
    exit 1
}

Set-Location $PSScriptRoot
Write-Host "=== Jaylin_love_Erika Token Deploy ===" -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env not found" -ForegroundColor Red
    exit 1
}

Write-Host "[1/3] Linking Vercel project..." -ForegroundColor Yellow
npx vercel link --yes --token $Token 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Select an existing project or 'Create a new project' for Jaylin_love_Erika" -ForegroundColor Yellow
    npx vercel link --token $Token
}

Write-Host "[2/3] Uploading env vars..." -ForegroundColor Yellow
$envVars = @(
    "DATABASE_URL", "SESSION_SECRET", "DEEPSEEK_API_KEY", "DEEPSEEK_BASE_URL",
    "OPENAI_API_KEY", "OPENAI_BASE_URL", "EMBEDDING_MODEL",
    "RAG_TOP_K", "RAG_RERANK_TOP_K", "PGVECTOR_ENABLED",
    "SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER", "SMTP_PASS",
    "NOTIFY_EMAIL", "NEXT_PUBLIC_SITE_NAME"
)

foreach ($name in $envVars) {
    $line = Get-Content ".env" | Where-Object { $_ -match "^$name=" } | Select-Object -First 1
    if ($line) {
        $value = $line -replace "^$name=", "" -replace '^"|"$', ''
        if ($value -and $value -notmatch "your-|change-me|file:\./dev") {
            Write-Host "  $name" -ForegroundColor Gray
            $value | npx vercel env add $name production --force --token $Token 2>$null
        }
    }
}

Write-Host "[3/3] Deploying to production..." -ForegroundColor Yellow
npx vercel --prod --token $Token

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== Done! Send the vercel.app URL to Erika ===" -ForegroundColor Green
    Write-Host "Erika: erika / your password" -ForegroundColor Green
    Write-Host "Lin:   lin / your password" -ForegroundColor Green
} else {
    Write-Host "Deploy failed. Paste the error output for help." -ForegroundColor Red
}
