@echo off
echo ============================================
echo   GANTLY - React + Backend + MySQL
echo ============================================
echo.
echo Levantando los 3 servicios con Docker...
echo   - MySQL en puerto 3306
echo   - Backend (Spring Boot) en puerto 8080
echo   - Frontend (React) en puerto 5173
echo.
echo La primera vez tarda unos minutos en compilar.
echo.

docker compose -f docker-compose-react.yml up --build

pause
