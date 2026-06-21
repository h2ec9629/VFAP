# Archive old code files from OneDrive/VFAP
# Strategy: keep only data files, move everything else

$VFAPDir = "C:\Users\$env:USERNAME\OneDrive\work\VFAP"
$ArchiveDir = "$VFAPDir\_old_code"

New-Item -ItemType Directory -Force -Path $ArchiveDir | Out-Null
Write-Host "=== Archiving old code files ===" -ForegroundColor Cyan

# Files/folders to KEEP (data files)
$keepList = @(
    "_old_code",
    "_archive",
    ".streamlit",
    "SGT2605.db",
    "VFAPtoken.txt",
    "nittei.json",
    "ondan_flat.json",
    "ondan_lookup.json",
    "vfdb.json"
)
# Keep folders containing these keywords
$keepKeywords = @("SGT", "onedrive", "streamlit", "clean", "kriin", "archive", "old_code")

Get-ChildItem $VFAPDir | ForEach-Object {
    $item = $_
    $name = $item.Name

    # Skip if in keep list
    if ($keepList -contains $name) { return }

    # Skip xlsm/db just in case
    if ($name -match "\.(db|xlsm|xlsx)$") { return }

    # Skip folders with keep keywords
    foreach ($kw in $keepKeywords) {
        if ($name -like "*$kw*") { return }
    }

    # Move it
    Move-Item $item.FullName "$ArchiveDir\$name" -Force
    Write-Host "  moved: $name" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green
Write-Host ""
Write-Host "Remaining in VFAP:"
Get-ChildItem $VFAPDir | ForEach-Object { Write-Host "  $($_.Name)" }

Read-Host "Press Enter to exit"
