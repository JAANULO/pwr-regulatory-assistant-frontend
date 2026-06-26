@echo off
echo Uruchamianie serwera frontendowego na porcie 8000...
echo Otwieranie przegladarki: http://localhost:8000
start http://localhost:8000
python -m http.server 8000
pause

