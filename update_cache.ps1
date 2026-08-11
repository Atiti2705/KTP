$files = Get-ChildItem -Path 'd:\papuia\Web\KTP Website' -Recurse -Filter '*.html'
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match 'v=1785271586') {
        $newContent = $content -replace 'v=1785271586', 'v=1786469281'
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "Updated: $($file.Name)"
    }
}
Write-Host "Cache update complete!"
