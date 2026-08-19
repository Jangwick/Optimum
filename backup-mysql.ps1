param(
    [string]$Database = 'claims_solutions',
    [string]$User = 'root',
    [string]$Password = '',
    [string]$BackupDir = './backups'
)

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupFile = Join-Path $BackupDir "${Database}-${timestamp}.sql"

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$env:MYSQL_PWD = $Password
mysqldump -u $User $Database > $backupFile

Write-Output "Backup saved to $backupFile"
