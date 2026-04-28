$listeners = Get-NetTCPConnection -LocalPort 8088 -State Listen -ErrorAction SilentlyContinue
if (-not $listeners) {
  Write-Host 'No process is using port 8088.'
  exit 0
}

$processIds = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($processId in $processIds) {
  try {
    Stop-Process -Id $processId -Force -ErrorAction Stop
    Write-Host "Stopped process using port 8088: $processId"
  } catch {
    Write-Host "Could not stop PID ${processId}: $($_.Exception.Message)"
  }
}
