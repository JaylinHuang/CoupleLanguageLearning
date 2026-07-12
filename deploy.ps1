# Jaylin_love_Erika - Vercel deploy script (PowerShell)
# Usage: .\deploy.ps1

Write-Host "=== Jaylin_love_Erika Deploy Wizard ===" -ForegroundColor Cyan
Write-Host ""

# 1. Go to project directory
Set-Location $PSScriptRoot
Write-Host "[1/5] Current directory: $(Get-Location)" -ForegroundColor Green

# 2. Check Vercel login (skip browser login if VERCEL_TOKEN is set)
Write-Host "[2/5] Checking Vercel login status..." -ForegroundColor Yellow

if ($env:VERCEL_TOKEN) {
    Write-Host "Using VERCEL_TOKEN from environment" -ForegroundColor Green
    $TokenArg = @("--token", $env:VERCEL_TOKEN)
} else {
    $whoami = npx vercel whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Browser login failed? (common on Chinese Windows usernames)" -ForegroundColor Yellow
        Write-Host "Use token deploy instead:" -ForegroundColor Yellow
        Write-Host '  1. Open https://vercel.com/account/tokens' -ForegroundColor Cyan
        Write-Host '  2. Create token, then run: .\deploy-token.ps1 -Token "your_token"' -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Trying browser login anyway..." -ForegroundColor Yellow
        npx vercel login
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Login failed. Please use deploy-token.ps1 (see above)." -ForegroundColor Red
            exit 1
        }
    }
    Write-Host "Logged in: $whoami" -ForegroundColor Green
    $TokenArg = @()
}

# 3. Link project (first run will ask a few questions; defaults are fine)
Write-Host "[3/5] Linking Vercel project..." -ForegroundColor Yellow
if ($TokenArg.Count -gt 0) {
    npx vercel link --yes @TokenArg 2>$null
    if ($LASTEXITCODE -ne 0) { npx vercel link @TokenArg }
} else {
    npx vercel link --yes 2>$null
    if ($LASTEXITCODE -ne 0) { npx vercel link }
}

# 4. Read .env and upload environment variables
Write-Host "[4/5] Uploading environment variables to Vercel..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env not found. Make sure .env exists and DATABASE_URL points to Neon." -ForegroundColor Red
    exit 1
}

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
            Write-Host "  setting $name ..." -ForegroundColor Gray
            if ($TokenArg.Count -gt 0) {
                $value | npx vercel env add $name production --force @TokenArg 2>$null
            } else {
                $value | npx vercel env add $name production --force 2>$null
            }
        } else {
            Write-Host "  skipped $name (placeholder value, fill it in .env first)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "IMPORTANT: DATABASE_URL in .env must be the Neon connection string, not file:./dev.db" -ForegroundColor Yellow
Write-Host ""

# 5. Deploy to production
Write-Host "[5/5] Deploying to production..." -ForegroundColor Yellow
if ($TokenArg.Count -gt 0) {
    npx vercel --prod @TokenArg
} else {
    npx vercel --prod
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== Deploy complete! ===" -ForegroundColor Green
    Write-Host "Send the https://xxx.vercel.app URL above to Erika." -ForegroundColor Green
    Write-Host "Erika login: erika / (see .env ERIKA_PASSWORD)" -ForegroundColor Green
    Write-Host "Your login:  lin / (see .env LIN_PASSWORD)" -ForegroundColor Green
} else {
    Write-Host "Deploy failed. Please share the error output." -ForegroundColor Red
}
