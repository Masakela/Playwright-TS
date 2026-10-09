# Start the reference agent, run the Playwright suite against it, then stop it.
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$port = if ($env:PORT) { $env:PORT } else { "8080" }
$base = "http://localhost:$port"
$env:AGENT_BASE_URL = $base
$env:ALLURE = "1"; $env:PORT = $port

# Corporate-proxy guard: make the local agent bypass any HTTP(S)_PROXY (which
# otherwise intercepts localhost and answers 403). Merge, don't clobber.
$locals = "localhost,127.0.0.1,::1"
$env:NO_PROXY = if ($env:NO_PROXY) { "$($env:NO_PROXY),$locals" } else { $locals }
$env:no_proxy = $env:NO_PROXY

Write-Host "Starting reference agent on $base ..."
$agent = Start-Process -FilePath "node" -ArgumentList "agent-server/server.js" -PassThru -NoNewWindow
try {
    for ($i = 0; $i -lt 30; $i++) {
        try { Invoke-RestMethod "$base/health" -TimeoutSec 2 | Out-Null; break } catch { Start-Sleep -Milliseconds 500 }
    }
    if (-not (Test-Path node_modules)) { npm install }
    try { npx playwright install | Out-Null } catch {}
    npx playwright test
    node scripts/kpi-report.js --pw test-results/results.json --out kpis-out
    Write-Host "Done. KPI dashboard: kpis-out/index.html"
}
finally {
    if ($agent -and -not $agent.HasExited) { Stop-Process -Id $agent.Id -Force }
}
