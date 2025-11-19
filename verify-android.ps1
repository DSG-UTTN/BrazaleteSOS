# 🔍 Script de Verificación de Android Studio

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Verificando Configuración Android" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Verificar ANDROID_HOME
Write-Host "1. Verificando ANDROID_HOME..." -ForegroundColor Yellow
$androidHome = $env:ANDROID_HOME
if ($androidHome) {
    Write-Host "   ✅ ANDROID_HOME = $androidHome" -ForegroundColor Green
    if (Test-Path $androidHome) {
        Write-Host "   ✅ La ruta existe" -ForegroundColor Green
    } else {
        Write-Host "   ❌ La ruta NO existe" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ ANDROID_HOME no está configurado" -ForegroundColor Red
}
Write-Host ""

# Verificar ADB
Write-Host "2. Verificando ADB (Android Debug Bridge)..." -ForegroundColor Yellow
try {
    $adbVersion = adb --version 2>&1
    if ($adbVersion -match "Android Debug Bridge") {
        Write-Host "   ✅ ADB instalado correctamente" -ForegroundColor Green
        Write-Host "   $($adbVersion[0])" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ ADB no encontrado en PATH" -ForegroundColor Red
}
Write-Host ""

# Verificar Java
Write-Host "3. Verificando Java JDK..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1
    if ($javaVersion) {
        Write-Host "   ✅ Java instalado" -ForegroundColor Green
        Write-Host "   $($javaVersion[0])" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Java no encontrado" -ForegroundColor Red
}
Write-Host ""

# Verificar componentes del SDK
Write-Host "4. Verificando componentes del SDK..." -ForegroundColor Yellow
if ($androidHome) {
    $platformTools = Test-Path "$androidHome\platform-tools"
    $buildTools = Test-Path "$androidHome\build-tools"
    $platforms = Test-Path "$androidHome\platforms"
    
    if ($platformTools) { Write-Host "   ✅ Platform-tools instalado" -ForegroundColor Green } 
    else { Write-Host "   ❌ Platform-tools NO encontrado" -ForegroundColor Red }
    
    if ($buildTools) { Write-Host "   ✅ Build-tools instalado" -ForegroundColor Green } 
    else { Write-Host "   ❌ Build-tools NO encontrado" -ForegroundColor Red }
    
    if ($platforms) { Write-Host "   ✅ Platforms instalado" -ForegroundColor Green } 
    else { Write-Host "   ❌ Platforms NO encontrado" -ForegroundColor Red }
}
Write-Host ""

# Verificar dispositivos conectados
Write-Host "5. Verificando dispositivos Android conectados..." -ForegroundColor Yellow
try {
    $devices = adb devices
    Write-Host "   $devices" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ No se puede ejecutar 'adb devices'" -ForegroundColor Red
}
Write-Host ""

# Resumen
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Verificación Completa" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si todo está ✅, puedes continuar con:" -ForegroundColor Green
Write-Host "  npm run android" -ForegroundColor Yellow
Write-Host ""
