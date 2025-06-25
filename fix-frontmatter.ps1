# PowerShell script to fix YAML front matter issues in markdown files
# This script will:
# 1. Quote all values in YAML front matter to avoid parsing errors
# 2. Ensure slugs are absolute (start with /)
# 3. Fix any other YAML syntax issues

$docsPath = "docs"
$markdownFiles = Get-ChildItem -Path $docsPath -Recurse -Filter "*.md"

$fixedCount = 0
$totalCount = $markdownFiles.Count

Write-Host "Scanning $totalCount markdown files for YAML front matter issues..." -ForegroundColor Yellow

foreach ($file in $markdownFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $modified = $false
    
    # Check if file has YAML front matter
    if ($content -match '^---\s*\r?\n(.*?)\r?\n---\s*\r?\n' -or $content -match '^---\s*\n(.*?)\n---\s*\n') {
        $frontMatter = $matches[1]
        $newFrontMatter = $frontMatter
        
        # Split front matter into lines
        $lines = $frontMatter -split '\r?\n'
        $newLines = @()
        
        foreach ($line in $lines) {
            $trimmedLine = $line.Trim()
            
            # Skip empty lines
            if ([string]::IsNullOrWhiteSpace($trimmedLine)) {
                $newLines += $line
                continue
            }
            
            # Check if line contains key-value pair
            if ($trimmedLine -match '^([^:]+):\s*(.*)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                
                # Skip if already quoted
                if ($value.StartsWith('"') -and $value.EndsWith('"')) {
                    $newLines += $line
                    continue
                }
                
                # Quote the value if it contains special characters or is not empty
                if ($value -ne '' -and ($value -match '[:&*#?|>!%@`]' -or $value -match '\s')) {
                    $quotedValue = '"' + $value.Replace('"', '\"') + '"'
                    $newLine = "$key`: $quotedValue"
                    $newLines += $newLine
                    $modified = $true
                } else {
                    $newLines += $line
                }
            } else {
                $newLines += $line
            }
        }
        
        # Reconstruct front matter
        $newFrontMatter = $newLines -join "`n"
        
        # Replace front matter in content
        $newContent = $content -replace '^---\s*\r?\n.*?\r?\n---\s*\r?\n', "---`n$newFrontMatter`n---`n"
        
        # Ensure slug is absolute (starts with /)
        if ($newContent -match 'slug:\s*"([^"]*)"') {
            $currentSlug = $matches[1]
            if (-not $currentSlug.StartsWith('/')) {
                $absoluteSlug = '/' + $currentSlug.TrimStart('/')
                $newContent = $newContent -replace "slug:\s*`"$currentSlug`"", "slug: `"$absoluteSlug`""
                $modified = $true
            }
        } elseif ($newContent -match 'slug:\s*([^\r\n]+)') {
            $currentSlug = $matches[1].Trim()
            if (-not $currentSlug.StartsWith('/')) {
                $absoluteSlug = '/' + $currentSlug.TrimStart('/')
                $newContent = $newContent -replace "slug:\s*$currentSlug", "slug: `"$absoluteSlug`""
                $modified = $true
            }
        }
        
        # Write back to file if modified
        if ($modified) {
            Set-Content -Path $file.FullName -Value $newContent -NoNewline
            $fixedCount++
            Write-Host "Fixed: $($file.FullName)" -ForegroundColor Green
        }
    }
}

Write-Host "`nScan completed!" -ForegroundColor Green
Write-Host "Fixed $fixedCount out of $totalCount files" -ForegroundColor Cyan

if ($fixedCount -gt 0) {
    Write-Host "`nStarting development server..." -ForegroundColor Yellow
    npm run start
} else {
    Write-Host "`nNo files needed fixing. Starting development server..." -ForegroundColor Yellow
    npm run start
} 