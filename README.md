# Asystent Regulaminowy PWr - Frontend

To jest repozytorium frontendu dla aplikacji Asystenta Regulaminowego PWr. Projekt ten to tzw. Single Page Application (SPA), składająca się w pełni ze statycznych plików HTML, CSS i JavaScript.

Aplikacja jest przystosowana do hostowania m.in. na platformie **GitHub Pages** i łączy się z zewnętrznym serwerem backendowym (API).

## Struktura plików
* `index.html` - główny widok z czatem do Asystenta
* `graf.html` - widok prezentujący graf wiedzy
* `lab.html` - narzędzia analityczne
* `static/` - arkusze stylów (CSS), skrypty JavaScript (JS) oraz obrazki

## Konfiguracja
Aby podłączyć interfejs do backendu, należy wyedytować plik `static/js/main.js` (oraz początki plików `graf.html` i `lab.html`), gdzie u góry znajduje się definicja:

```javascript
const API_BASE_URL = 'http://127.0.0.1:5000'; // adres backendu
const API_KEY = 'TWÓJ_KLUCZ_API'; // klucz wygenerowany przez panel admina backendu
```

## Uruchamianie lokalne
Frontend nie wymaga używania narzędzi takich jak Node.js do uruchomienia (korzysta z czystego Vanilla JS). Wystarczy otworzyć `index.html` w przeglądarce bezpośrednio, wykorzystać rozszerzenie typu "Live Server" w edytorze kodu, albo uruchomić w terminalu prosty serwer:
```bash
python -m http.server 8000
```
Następnie przejdź pod adres [http://localhost:8000](http://localhost:8000).
