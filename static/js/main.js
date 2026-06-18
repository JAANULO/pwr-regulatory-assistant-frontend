import { wyslijZapytanie, pobierzHistorieZBackendu, wyslijFeedbackNaBackend } from './api.js';

import {
  ladujMotyw,
  zapiszMotyw,
  ladujUstawieniaDopasowania,
  zapiszUstawieniaDopasowania,
  zapiszHistorieLokalnie,
  wyczyscHistorieLokalna,
} from './storage.js';

import {
  escHtml,
  scrollDol,
  pokazTyping,
  ukryjTyping,
  dodajWiadomoscUzytkownika,
  renderujOdpowiedz,
  renderujKomunikatBledu,
} from './ui.js';

const chatEl = document.getElementById('chat');
const inputEl = document.getElementById('input');
const btnEl = document.getElementById('btn');

let wybraneZrodloIndywidualne = null;

let ostatniKontekstTytul = null;
let ostatniKontekstPytanie = null;

// INICJALIZACJA
ladujMotyw();
ladujUstawieniaDopasowania();

// EVENT LISTENERS DO PRZYCISKÓW (zastępują onclick z HTML)
document.getElementById('btn-clear')?.addEventListener('click', wyczyscChat);
document.getElementById('btn-options')?.addEventListener('click', otworzOpcje);
document.getElementById('btnCloseOpcje')?.addEventListener('click', zamknijOpcje);
document.getElementById('btnTheme')?.addEventListener('click', przelaczMotyw);
document.getElementById('btnPdf')?.addEventListener('click', zapiszPdf);
document.getElementById('btn-toggle-sim')?.addEventListener('change', przelaczDopasowanie);
document
  .getElementById('btnGraf')
  ?.addEventListener('click', () => window.open('graf.html', '_blank'));
document.getElementById('btnCloseSidebar')?.addEventListener('click', toggleSidebar);
document.getElementById('btn-scroll-down')?.addEventListener('click', () => scrollDol(chatEl));
document.getElementById('btn')?.addEventListener('click', wyslij);

// Zamykanie modala po kliknięciu w tło
document.getElementById('opcjeModal')?.addEventListener('click', (event) => {
  if (event.target === document.getElementById('opcjeModal')) zamknijOpcje();
});
document
  .getElementById('modalContent')
  ?.addEventListener('click', (event) => event.stopPropagation());

// Delegacja zdarzeń dla "chips" (np. proste pytania)
document.getElementById('welcome-chips')?.addEventListener('click', (e) => {
  if (e.target.classList.contains('chip')) {
    zadaj(e.target);
  }
});

// Auto-resize textarea
inputEl?.addEventListener('input', () => {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
  const len = inputEl.value.length;
  const hint = document.getElementById('hint');
  if (len > 200) {
    hint.textContent = `⚠ Za długie pytanie (${len}/200)`;
    hint.style.color = 'var(--danger)';
  } else {
    hint.textContent = 'Enter – wyślij · Shift+Enter – nowa linia';
    hint.style.color = '';
  }
});

// Enter wysyła, Shift+Enter nowa linia
inputEl?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    wyslij();
  }
});

function zadaj(chip) {
  inputEl.value = chip.textContent;
  wyslij();
}

function wyczyscChat() {
  wyczyscHistorieLokalna();
  ostatniKontekstTytul = null;
  ostatniKontekstPytanie = null;
  chatEl.innerHTML = `<div class="welcome" id="welcome">
      <div class="big">Zapytaj o <span>regulamin</span></div>
      <p>Przeszukuję regulamin studiów PWr i zwracam właściwy paragraf wraz ze źródłem.</p>
      <div class="chips" id="welcome-chips">
        <div class="chip">ile razy można podejść do egzaminu?</div>
        <div class="chip">kiedy można wziąć urlop dziekański?</div>
        <div class="chip">co grozi za nieobecności?</div>
        <div class="chip">jak wznowić studia po skreśleniu?</div>
        <div class="chip">jak oblicza się średnią ocen?</div>
      </div></div>`;
  // Po re-renderze HTML musimy od nowa przypisać eventy dla nowych chipów
  document.getElementById('welcome-chips')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('chip')) {
      zadaj(e.target);
    }
  });
}

function otworzOpcje() {
  document.getElementById('opcjeModal')?.classList.add('active');
}

function zamknijOpcje() {
  document.getElementById('opcjeModal')?.classList.remove('active');
  const infoDiv = document.getElementById('infoBazaWidzy');
  if (infoDiv) infoDiv.style.display = 'none';
}

function przelaczMotyw() {
  document.body.classList.toggle('light-theme');
  zapiszMotyw(document.body.classList.contains('light-theme'));
}

function przelaczDopasowanie() {
  document.body.classList.toggle('hide-similarity');
  const ukryte = document.body.classList.contains('hide-similarity');
  zapiszUstawieniaDopasowania(!ukryte);
  const checkbox = document.getElementById('btn-toggle-sim');
  if (checkbox) checkbox.checked = !ukryte;
}

function zapiszPdf() {
  zamknijOpcje();
  const element = document.getElementById('chat');
  const kolorTla = document.body.classList.contains('light-theme') ? '#f5f5f7' : '#0d0d0f';
  const opt = {
    margin: [10, 5, 10, 5],
    filename: 'rozmowa_regulamin_pwr.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: kolorTla },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };
  html2pdf().set(opt).from(element).save();
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('open');
  if (sidebar.classList.contains('open')) {
    zaladujHistorie();
  }
}

async function zaladujHistorie() {
  const content = document.getElementById('sidebar-content');
  content.innerHTML =
    '<p style="padding:16px;color:var(--muted);font-size:12px;">Ładowanie historii...</p>';
  try {
    const dane = await pobierzHistorieZBackendu();
    if (dane.error) {
      content.innerHTML =
        '<p style="padding:16px;color:var(--danger);font-size:12px;">Błąd bazy: ' +
        escHtml(dane.error) +
        '</p>';
      return;
    }
    if (!Array.isArray(dane) || dane.length === 0) {
      content.innerHTML =
        '<p style="padding:16px;color:var(--muted);font-size:12px;">Brak wpisów w bazie.</p>';
      return;
    }
    content.innerHTML = dane
      .map((d) => {
        const escapedValue = escHtml(d.pytanie).replace(/'/g, "\\'");
        return (
          '<div class="sidebar-item" data-pytanie="' +
          escapedValue +
          '">' +
          escHtml(d.pytanie) +
          '</div>'
        );
      })
      .join('');

    // Delegacja eventów dla sidebar-item
    content.querySelectorAll('.sidebar-item').forEach((el) => {
      el.addEventListener('click', () => wybierzZHistorii(el.dataset.pytanie));
    });
  } catch (err) {
    content.innerHTML =
      '<p style="padding:16px;color:var(--danger);font-size:12px;">Błąd pobierania historii.</p>';
  }
}

function wybierzZHistorii(pytanie) {
  toggleSidebar();
  inputEl.value = pytanie;
  wyslij();
}

// Globalnie dostępna funkcja wyslijFeedback dla onclicków
window.wyslijFeedback = async function (btn) {
  const pid = btn.dataset.pid;
  const ocena = parseInt(btn.dataset.ocena);
  if (!pid) return;
  btn.closest('.feedback-row').innerHTML =
    ocena === 1
      ? '<span style="color:var(--accent)">Dzięki! ✓</span>'
      : '<span style="color:var(--muted)">Zapisano, poprawimy ✓</span>';
  try {
    await wyslijFeedbackNaBackend(parseInt(pid), ocena);
  } catch (err) {
    console.error('Błąd wysyłania feedbacku', err);
  }
};

function dodajOdpowiedzBota(dane) {
  const wrap = document.createElement('div');
  wrap.className = 'message-wrap';
  wrap.dataset.ts = new Date().toLocaleString('pl-PL');
  const pct = Math.round((dane.podobienstwo || 0) * 100);
  const pct2 = Math.round((dane.podobienstwo2 || 0) * 100);
  let sourcesHtml = '';
  if (dane.tytul) {
    sourcesHtml +=
      '<div class="source-tag"><span class="dot"></span><span class="title-text">' +
      escHtml(dane.tytul) +
      '</span></div>';
  }
  if (dane.tytul2) {
    sourcesHtml +=
      '<div class="source-tag"><span class="dot secondary"></span><span class="title-text">' +
      escHtml(dane.tytul2) +
      '</span></div>';
  }
  let barsHtml = '';
  if (dane.tytul) {
    barsHtml +=
      '<div class="sim-row"><span class="sim-label">dopasowanie</span><div class="sim-track"><div class="sim-fill" data-pct="' +
      pct +
      '"></div></div><span class="sim-pct">' +
      pct +
      '%</span></div>';
  }
  if (dane.tytul2) {
    barsHtml +=
      '<div class="sim-row"><span class="sim-label">powiązany</span><div class="sim-track"><div class="sim-fill secondary" data-pct="' +
      pct2 +
      '"></div></div><span class="sim-pct secondary">' +
      pct2 +
      '%</span></div>';
  }

  let czystyKopiowanyTekst = dane.wstep || dane.odpowiedz || '';
  if (dane.punkty && dane.punkty.length > 0) {
    czystyKopiowanyTekst += '\n' + dane.punkty.map((p) => '- ' + p).join('\n');
  }
  const skrzyneczkacopyHtml = escHtml(czystyKopiowanyTekst);

  let sformatowanaPelnaTresc = escHtml(dane.pelna_tresc || '');
  if (dane.najlepsze_zdanie && sformatowanaPelnaTresc) {
    const czysteNajlepszeZdanie = escHtml(dane.najlepsze_zdanie);
    if (sformatowanaPelnaTresc.includes(czysteNajlepszeZdanie)) {
      sformatowanaPelnaTresc = sformatowanaPelnaTresc.replace(
        czysteNajlepszeZdanie,
        '<mark class="highlight-zdanie">' + czysteNajlepszeZdanie + '</mark>',
      );
    }
  }

  let sformatowanaZlamanaTresc = sformatowanaPelnaTresc.replace(/\n+/g, '<br><br>');
  if (dane.slowa_kluczowe && dane.slowa_kluczowe.length > 0) {
    dane.slowa_kluczowe.forEach((slowo) => {
      if (slowo.length >= 3) {
        const regex = new RegExp(`(${slowo})`, 'gi');
        sformatowanaZlamanaTresc = sformatowanaZlamanaTresc.replace(
          regex,
          '<mark class="highlight-zdanie" style="background-color: var(--accent); color: #000;">$1</mark>',
        );
      }
    });
  }

  const natychmiastowyParagraf = dane.pelna_tresc
    ? '<div style="margin-top: 8px;"><button class="btn-rozwin" onclick="rozwinTresc(this)">▼ pokaż pełny paragraf</button>' +
      '<div class="pelna-tresc" style="display: none; line-height: 1.5; font-size: 0.9em; margin-top: 8px;">' +
      sformatowanaZlamanaTresc +
      '</div></div>'
    : '';

  wrap.innerHTML =
    '<div class="msg-bot">' +
    '<div class="bot-avatar"><img src="static/logo.png" alt="Logo"></div>' +
    '<div class="bot-content">' +
    '<div class="bubble type-target"></div>' +
    natychmiastowyParagraf +
    (sourcesHtml ? '<div class="source-row" style="opacity:0">' + sourcesHtml + '</div>' : '') +
    '<div style="opacity:0">' +
    barsHtml +
    '</div>' +
    '<div class="feedback-row" style="opacity:0">' +
    '<button class="btn-feedback" data-ocena="1" onclick="wyslijFeedback(this)">👍</button>' +
    '<button class="btn-feedback" data-ocena="-1" onclick="wyslijFeedback(this)">👎</button>' +
    '<button class="btn-copy" onclick="kopiujOdpowiedz(this)" data-copy="' +
    skrzyneczkacopyHtml +
    '" data-tooltip="Skopiuj odpowiedź">📋</button>' +
    '</div>' +
    '</div>' +
    '</div>';

  if (dane.pytanie_id) {
    wrap.querySelectorAll('.btn-feedback').forEach((btn) => {
      btn.dataset.pid = dane.pytanie_id;
    });
  }
  chatEl.appendChild(wrap);
  scrollDol(chatEl);

  const docelowyHtml = renderujOdpowiedz(dane);
  const targetBubble = wrap.querySelector('.type-target');
  let stalyHtml = '';
  let kursorWTagu = false;
  let zapamietywanyTag = '';
  let i = 0;

  function streamujZnak() {
    if (i >= docelowyHtml.length) {
      targetBubble.innerHTML = docelowyHtml;
      wrap.querySelectorAll('[style*="opacity"]').forEach((el) => {
        el.style.opacity = '1';
        el.style.transition = 'opacity 0.6s ease';
      });
      requestAnimationFrame(() => {
        wrap.querySelectorAll('.sim-fill').forEach((bar) => {
          setTimeout(() => {
            bar.style.width = bar.dataset.pct + '%';
          }, 100);
        });
      });
      scrollDol(chatEl);
      return;
    }
    const litera = docelowyHtml[i];
    if (litera === '<') kursorWTagu = true;
    if (kursorWTagu) {
      zapamietywanyTag += litera;
      if (litera === '>') {
        kursorWTagu = false;
        stalyHtml += zapamietywanyTag;
        zapamietywanyTag = '';
      }
    } else {
      stalyHtml += litera;
      targetBubble.innerHTML = stalyHtml;
      if (i % 10 === 0) scrollDol(chatEl);
    }
    i++;
    setTimeout(streamujZnak, kursorWTagu ? 0 : 5);
  }
  streamujZnak();
}

async function wyslij() {
  const tekst = inputEl.value.trim();
  if (tekst.length < 3) {
    const hint = document.getElementById('hint');
    if (hint) {
      hint.textContent = '⚠ Twoje pytanie jest za krótkie!';
      hint.style.color = 'var(--danger)';
      setTimeout(() => {
        hint.textContent = 'Enter – wyślij · Shift+Enter – nowa linia';
        hint.style.color = '';
      }, 3000);
    }
    return;
  }
  inputEl.value = '';
  inputEl.style.height = 'auto';
  btnEl.disabled = true;

  dodajWiadomoscUzytkownika(chatEl, tekst);
  pokazTyping(chatEl);

  try {
    let aktZrodlo = wybraneZrodloIndywidualne || 'Wszystkie dokumenty';
    if (aktZrodlo === 'odlacz') {
      ukryjTyping();
      dodajOdpowiedzBota({
        odpowiedz: 'Baza wiedzy jest odłączona. Podłącz ją w opcjach.',
        tytul: null,
        podobienstwo: 0,
      });
      btnEl.disabled = false;
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    const dane = await wyslijZapytanie(
      tekst,
      aktZrodlo,
      ostatniKontekstTytul,
      ostatniKontekstPytanie,
      token,
    );

    ukryjTyping();

    if (dane.disambiguation) {
      let opcjeHtml = '';
      dane.opcje.forEach((opcja) => {
        opcjeHtml += `<button class="btn-chip chip">${escHtml(opcja)}</button>`;
      });
      const disambigHtml = `<div style="margin-bottom: 8px;">${escHtml(dane.komunikat)}</div><div class="chips-container" style="flex-wrap: wrap;">${opcjeHtml}</div>`;

      const wrap = document.createElement('div');
      wrap.className = 'message-wrap';
      wrap.dataset.ts = new Date().toLocaleString('pl-PL');
      wrap.innerHTML = `<div class="msg-bot"><div class="bot-avatar"><img src="static/logo.png" alt="Logo"></div><div class="bot-content"><div class="bubble">${disambigHtml}</div></div></div>`;

      // Delegacja kliknięć z powrotem do czatu
      wrap.querySelectorAll('.chip').forEach((btn) => {
        btn.addEventListener('click', () => zadaj(btn));
      });

      chatEl.appendChild(wrap);
      scrollDol(chatEl);
      zapiszHistorieLokalnie(tekst, dane.komunikat);
      return;
    }

    dodajOdpowiedzBota(dane);

    if (dane.kontekst_tytul) {
      ostatniKontekstTytul = dane.kontekst_tytul;
      ostatniKontekstPytanie = tekst;
    }
  } catch (err) {
    ukryjTyping();
    renderujKomunikatBledu(chatEl);
  } finally {
    btnEl.disabled = false;
    inputEl.focus();
  }
}

// Obsługa przycisku "Wróć w dół"
const btnScrollDown = document.getElementById('btn-scroll-down');
if (btnScrollDown && chatEl) {
  chatEl.addEventListener('scroll', () => {
    if (chatEl.scrollHeight - chatEl.scrollTop - chatEl.clientHeight > 150) {
      btnScrollDown.classList.add('show');
    } else {
      btnScrollDown.classList.remove('show');
    }
  });
}

// Obsługa gestów swipe dla bocznego menu (Sidebar)
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

document.addEventListener(
  'touchstart',
  (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  },
  { passive: true },
);

document.addEventListener(
  'touchend',
  (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 80) {
      const sidebar = document.getElementById('sidebar');
      const isOpen = sidebar.classList.contains('open');
      if (diffX > 0 && !isOpen && touchStartX < 40) {
        toggleSidebar();
      } else if (diffX < 0 && isOpen) {
        toggleSidebar();
      }
    }
  },
  { passive: true },
);
