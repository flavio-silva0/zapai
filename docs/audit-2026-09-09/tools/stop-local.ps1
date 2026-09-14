$ErrorActionPreference = 'Stop'
$auditRuntime = Join-Path $env:LOCALAPPDATA 'ZapAI-audit-runtime'
$workspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..'))
$postgresData = [IO.Path]::GetFullPath((Join-Path $auditRuntime 'pgdata'))
if (-not $postgresData.StartsWith([IO.Path]::GetFullPath($auditRuntime) + [IO.Path]::DirectorySeparatorChar)) { throw 'Invalid audit data path' }
$processes = Get-CimInstance Win32_Process
$targets = $processes | Where-Object {
  ($_.Name -eq 'node.exe' -and $_.CommandLine -like '*docs/audit-2026-09-09/tools/local-stack.cjs*') -or
  ($_.Name -eq 'node.exe' -and $_.CommandLine -like '*audit-2026-09-09*local-backend.cjs*') -or
  ($_.Name -eq 'postgrest.exe' -and $_.ExecutablePath -eq (Join-Path $auditRuntime 'postgrest/postgrest.exe'))
}
foreach ($target in $targets) { Stop-Process -Id $target.ProcessId -ErrorAction SilentlyContinue }
$front = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
foreach ($listener in $front) {
  $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)"
  if ($processInfo.Name -eq 'node.exe' -and $processInfo.CommandLine -like '*node_modules/vite/bin/vite.js*--host 127.0.0.1*') {
    Stop-Process -Id $processInfo.ProcessId -ErrorAction SilentlyContinue
  }
}
$pgCtl = Join-Path $auditRuntime 'node_modules/@embedded-postgres/windows-x64/native/bin/pg_ctl.exe'
if (Test-Path -LiteralPath (Join-Path $postgresData 'postmaster.pid')) { & $pgCtl -D $postgresData stop -m fast }
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object LocalPort -In 3001,5173,55432,55433,55434 | Select-Object LocalAddress,LocalPort,OwningProcess
