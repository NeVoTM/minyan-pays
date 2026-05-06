param()

$ErrorActionPreference = "SilentlyContinue"

function Emit-Allow([string]$agentMessage) {
  if ([string]::IsNullOrWhiteSpace($agentMessage)) {
    $out = @{ permission = "allow" }
  } else {
    $out = @{
      permission = "allow"
      agent_message = $agentMessage
    }
  }
  $out | ConvertTo-Json -Compress
}

# Hook input is optional for this policy script.

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $repoRoot

$insideRepo = (git rev-parse --is-inside-work-tree) -eq "true"
if (-not $insideRepo) {
  Emit-Allow ""
  exit 0
}

$changedFiles = @(git status --porcelain)
$changedCount = $changedFiles.Count

if ($changedCount -eq 0) {
  Emit-Allow ""
  exit 0
}

$lastCommitEpochRaw = git log -1 --format=%ct
$nowEpoch = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$secondsSinceCommit = 0

if ($lastCommitEpochRaw -match '^\d+$') {
  $secondsSinceCommit = $nowEpoch - [int64]$lastCommitEpochRaw
}

$needsReminder = ($changedCount -ge 10) -or ($secondsSinceCommit -ge 3600)

if (-not $needsReminder) {
  Emit-Allow ""
  exit 0
}

$minutes = [Math]::Floor($secondsSinceCommit / 60)
$msg = "Checkpoint reminder: working tree has $changedCount changed file(s) and last commit was $minutes minute(s) ago. Consider committing now. If UI/layout touched, re-test similar screens/menus before commit. Do not push unless the user asks."

Emit-Allow $msg
exit 0
