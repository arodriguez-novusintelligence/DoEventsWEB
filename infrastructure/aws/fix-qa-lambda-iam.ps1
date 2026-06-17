# Añade permisos DynamoDB/S3 us-east-2 a roles lambda QA
param([string]$Region = "us-east-2")
$ErrorActionPreference = "Stop"
$policyPath = Join-Path $PSScriptRoot "qa-lambda-iam-policy.json"

$roles = aws lambda list-functions --region $Region `
  --query "Functions[?contains(FunctionName,'-qa-')].Role" --output text |
  ForEach-Object { $_.Split("`t") } | Where-Object { $_ } | Sort-Object -Unique

foreach ($roleArn in $roles) {
  $roleName = $roleArn.Split('/')[-1]
  Write-Host "IAM -> $roleName"
  aws iam put-role-policy --role-name $roleName --policy-name "qa-us-east-2-data-access" --policy-document "file://$policyPath" | Out-Null
}

Write-Host "Políticas IAM QA aplicadas a $($roles.Count) roles." -ForegroundColor Green
