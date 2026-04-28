param(
  [switch]$SkipMongoUri
)

$backendDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $backendDir

# Free the API port before starting a new Spring Boot instance.
$listeners = Get-NetTCPConnection -LocalPort 8088 -State Listen -ErrorAction SilentlyContinue
if ($listeners) {
  $processIds = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($processId in $processIds) {
    try {
      Stop-Process -Id $processId -Force -ErrorAction Stop
      Write-Host "Stopped process using port 8088: $processId"
    } catch {
      Write-Host "Could not stop PID ${processId}: $($_.Exception.Message)"
    }
  }
}

$env:SERVER_PORT = '8088'

if (-not $SkipMongoUri -and -not $env:SPRING_DATA_MONGODB_URI) {
  $env:SPRING_DATA_MONGODB_URI = 'mongodb+srv://sathnidu:Pass1234@cluster0.87biawa.mongodb.net/smart_campus?authSource=admin&retryWrites=true&w=majority'
}

.\mvnw.cmd spring-boot:run
