$sourceDir = "D:\JPUNS-Claude.6.5.0\frontend\components"
$destDir = "D:\staffhub-uns-pro\_analysis"

New-Item -ItemType Directory -Force -Path $destDir

# Files to copy
$files = @(
    "CandidateForm.tsx",
    "CandidatePhoto.tsx",
    "RirekishoPrintView.tsx",
    "OCRUploader.tsx"
)

# Copy individual files
foreach ($file in $files) {
    Copy-Item "$sourceDir\$file" -Destination $destDir -Force
    Write-Host "Copied $file"
}

# Copy candidates folder
Copy-Item "$sourceDir\candidates" -Destination $destDir -Recurse -Force
Write-Host "Copied candidates folder"

# Copy types if possible (guessing path)
$typesSource = "D:\JPUNS-Claude.6.5.0\frontend\types"
if (Test-Path $typesSource) {
    Copy-Item $typesSource -Destination "$destDir\types" -Recurse -Force
    Write-Host "Copied types folder"
}
