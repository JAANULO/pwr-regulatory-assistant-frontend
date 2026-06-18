export const THEME_KEY = 'pwr_chat_theme';
export const SIM_KEY = 'pwr_pokaz_dopasowanie';
export const HISTORIA_KEY = 'pwr_chat_historia';

export function ladujMotyw() {
  if (localStorage.getItem(THEME_KEY) === 'light') {
    document.body.classList.add('light-theme');
  }
}

export function zapiszMotyw(isLight) {
  localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
}

export function ladujUstawieniaDopasowania() {
  if (localStorage.getItem(SIM_KEY) !== 'true') {
    document.body.classList.add('hide-similarity');
  }
}

export function zapiszUstawieniaDopasowania(pokaz) {
  localStorage.setItem(SIM_KEY, pokaz ? 'true' : 'false');
}

export function zapiszHistorieLokalnie(pytanie, odpowiedz) {
  const hist = JSON.parse(localStorage.getItem(HISTORIA_KEY) || '[]');
  hist.push({ pytanie, odpowiedz, czas: new Date().toLocaleTimeString() });
  if (hist.length > 20) hist.shift(); // max 20 wpisów
  localStorage.setItem(HISTORIA_KEY, JSON.stringify(hist));
}

export function pobierzHistorieLokalna() {
  return JSON.parse(localStorage.getItem(HISTORIA_KEY) || '[]');
}

export function wyczyscHistorieLokalna() {
  sessionStorage.removeItem(HISTORIA_KEY); // Z oryginalnego kodu to było sessionStorage, można zachować lub zmienić
}
