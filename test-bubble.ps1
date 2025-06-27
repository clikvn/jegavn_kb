# PowerShell test script for Bubble config
Write-Host "🧪 Testing Bubble Config Fetch..." -ForegroundColor Green
Write-Host ""

try {
    Write-Host "📡 Calling config endpoint..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "http://localhost:3004/api/config" -Method GET
    
    Write-Host "✅ Config fetched successfully!" -ForegroundColor Green
    Write-Host "📋 Config details:" -ForegroundColor Cyan
    Write-Host "  - Has Config: $($response.config -ne $null)" -ForegroundColor White
    Write-Host "  - Has System Prompt: $($response.config.systemPrompt -ne $null)" -ForegroundColor White
    Write-Host "  - Has Model Parameters: $($response.config.modelParameters -ne $null)" -ForegroundColor White
    Write-Host "  - Temperature: $($response.config.modelParameters.temperature)" -ForegroundColor White
    Write-Host "  - Top P: $($response.config.modelParameters.topP)" -ForegroundColor White
    Write-Host "  - Max Output Tokens: $($response.config.modelParameters.maxOutputTokens)" -ForegroundColor White
    Write-Host "  - Source: $($response.source)" -ForegroundColor White
    
    if ($response.source -eq "bubble-database") {
        Write-Host "🎯 SUCCESS: Config is coming from Bubble database!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ WARNING: Config source is not Bubble database" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Make sure API server is running on port 3004" -ForegroundColor Yellow
} 