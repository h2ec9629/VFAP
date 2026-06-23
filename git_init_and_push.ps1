# VFAP Git init & push script

$RepoUrl = "https://github.com/h2ec9629/VFAP.git"
$RepoDir = "C:\Users\$env:USERNAME\Desktop\dev\VFAP"

Set-Location $RepoDir
Write-Host "=== VFAP Git Setup ===" -ForegroundColor Cyan
Write-Host "Dir: $(Get-Location)"

# Force remove any broken .git (home dir or repo dir)
$homeGit = "C:\Users\$env:USERNAME\.git"
if (Test-Path $homeGit) {
    Remove-Item $homeGit -Recurse -Force
    Write-Host "Removed stray .git from home dir" -ForegroundColor Yellow
}

$repoGit = "$RepoDir\.git"
if (Test-Path $repoGit) {
    Remove-Item $repoGit -Recurse -Force
    Write-Host "Removed broken .git from repo dir" -ForegroundColor Yellow
}

# Fresh init
git -C $RepoDir init
git -C $RepoDir branch -M main
Write-Host "OK: git init" -ForegroundColor Green

# Set remote
git -C $RepoDir remote add origin $RepoUrl
Write-Host "OK: remote set" -ForegroundColor Green

# Stage & commit
git -C $RepoDir add .
git -C $RepoDir commit -m "initial commit: dev setup"
Write-Host "OK: committed" -ForegroundColor Green

# Push
git -C $RepoDir branch -M main
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git -C $RepoDir push -u origin main

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green
Read-Host "Press Enter to exit"
