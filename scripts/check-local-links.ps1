param(
    [Parameter(Mandatory = $false)]
    [string]$RootPath = "."
)

$ErrorActionPreference = "Stop"

function Resolve-RepoPath {
    param(
        [string]$RepoRoot,
        [string]$CurrentFile,
        [string]$RawLink
    )

    $clean = $RawLink.Split("#")[0].Split("?")[0]
    if ([string]::IsNullOrWhiteSpace($clean)) {
        return $null
    }

    if ($clean.StartsWith("/")) {
        $relative = $clean.TrimStart("/")
        return Join-Path -Path $RepoRoot -ChildPath $relative
    }

    $parent = Split-Path -Parent $CurrentFile
    return Join-Path -Path $parent -ChildPath $clean
}

$repoRoot = (Resolve-Path -LiteralPath $RootPath).Path
$mdFiles = Get-ChildItem -Path $repoRoot -Recurse -File -Filter "*.md"

$pattern = '\[[^\]]+\]\(([^)]+)\)'
$invalid = @()

foreach ($file in $mdFiles) {
    $lines = Get-Content -LiteralPath $file.FullName
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $lineNo = $i + 1
        $line = $lines[$i]
        $matches = [regex]::Matches($line, $pattern)

        foreach ($m in $matches) {
            $link = $m.Groups[1].Value.Trim()
            if ([string]::IsNullOrWhiteSpace($link)) { continue }
            if ($link.StartsWith("http://") -or $link.StartsWith("https://")) { continue }
            if ($link.StartsWith("mailto:")) { continue }
            if ($link.StartsWith("#")) { continue }
            if ($link.StartsWith("file://")) { continue }

            $target = Resolve-RepoPath -RepoRoot $repoRoot -CurrentFile $file.FullName -RawLink $link
            if (-not $target) { continue }

            $exists = Test-Path -LiteralPath $target
            if (-not $exists) {
                $invalid += [pscustomobject]@{
                    File = $file.FullName.Substring($repoRoot.Length).TrimStart("\", "/")
                    Line = $lineNo
                    Link = $link
                }
            }
        }
    }
}

if ($invalid.Count -gt 0) {
    Write-Host "Invalid local links found:" -ForegroundColor Red
    foreach ($item in $invalid) {
        Write-Host "- $($item.File):$($item.Line) -> $($item.Link)" -ForegroundColor Red
    }
    exit 1
}

Write-Host "Local link check passed. Scanned $($mdFiles.Count) Markdown files."

