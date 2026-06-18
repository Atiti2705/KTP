$files = Get-ChildItem -Path '.' -Filter '*.html' -File
foreach ($f in $files) {
    $c = [System.IO.File]::ReadAllText($f.FullName)
    $c = $c.Replace('?v=221', '?v=221')
    [System.IO.File]::WriteAllText($f.FullName, $c)
    Write-Host "Updated: $($f.Name)"
}
