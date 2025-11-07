# Build script for Stashgifs Feed UI
# Compiles TypeScript to JavaScript
# Run from root folder - compiles src/ to stashgifs/app/assets/

Write-Host "Building Stashgifs Feed UI..."

# Check if TypeScript is available
$tscVersion = npx --yes typescript@latest tsc --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: TypeScript compiler not available"
    exit 1
}

Write-Host "TypeScript version: $tscVersion"

# Compile TypeScript
Write-Host "Compiling TypeScript from src/ to stashgifs/app/assets/..."
npx --yes typescript@latest tsc

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful! Output in stashgifs/app/assets/"
} else {
    Write-Host "Build failed!"
    exit 1
}

