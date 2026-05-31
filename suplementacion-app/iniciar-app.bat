@echo off
echo Instalando dependencias de Suplementacion App...
echo Esto puede tardar unos minutos...
call npm install --legacy-peer-deps
echo.
echo Iniciando Expo...
echo.
echo Para probar en WEB: abre el enlace que aparece abajo
echo Para probar en CELULAR: escanea el QR con Expo Go
echo.
call npm start
