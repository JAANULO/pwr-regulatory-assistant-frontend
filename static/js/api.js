export const API_BASE_URL = 'https://model-wp08.onrender.com';
export const API_KEY = 'UQVr8PrXNa.HIDyRCbyIAN9dLSnpP0510XfHz3AsFPq';

export async function wyslijZapytanie(pytanie, zrodlo, kontekstTytul, kontekstPytanie, token) {
  const res = await fetch(API_BASE_URL + '/zapytaj', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + API_KEY },
    body: JSON.stringify({
      pytanie: pytanie,
      zrodlo: zrodlo,
      kontekst_tytul: kontekstTytul,
      kontekst_pytanie: kontekstPytanie,
      token: token,
    }),
  });
  return await res.json();
}

export async function pobierzHistorieZBackendu() {
  const res = await fetch(API_BASE_URL + '/historia', {
    headers: { Authorization: 'Bearer ' + API_KEY },
  });
  return await res.json();
}

export async function pobierzZrodlaZBackendu() {
  const res = await fetch(`${API_BASE_URL}/zrodla`);
  return await res.json();
}

export async function wyslijFeedbackNaBackend(pytanie_id, ocena) {
  await fetch(API_BASE_URL + '/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + API_KEY },
    body: JSON.stringify({ pytanie_id, ocena }),
  });
}
