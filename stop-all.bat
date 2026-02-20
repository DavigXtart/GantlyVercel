@echo off
echo Parando todos los contenedores de Gantly...
docker compose -f docker-compose-angular.yml down 2>nul
docker compose -f docker-compose-react.yml down 2>nul
echo Contenedores parados.
pause
