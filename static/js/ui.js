export function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function scrollDol(chatEl) {
  chatEl.scrollTop = chatEl.scrollHeight;
}

export function ukryjWitajke() {
  const w = document.getElementById('welcome');
  if (w) w.remove();
}

export function pokazTyping(chatEl) {
  const el = document.createElement('div');
  el.className = 'typing-wrap';
  el.id = 'typing';
  el.innerHTML = `
  <div class="typing">
    <div class="bot-avatar"><img src="static/logo.png" alt="Logo"></div>
    <div class="typing-dots">
      <span></span><span></span><span></span>
    </div>
    <div class="typing-text">Szukam informacji...</div>
  </div>`;
  chatEl.appendChild(el);
  scrollDol(chatEl);
}

export function ukryjTyping() {
  const el = document.getElementById('typing');
  if (el) el.remove();
}

export function dodajWiadomoscUzytkownika(chatEl, tekst, znacznikCzasu = null) {
  ukryjWitajke();
  const wrap = document.createElement('div');
  wrap.className = 'message-wrap';
  wrap.dataset.ts = znacznikCzasu || new Date().toLocaleString('pl-PL');
  wrap.innerHTML = `
  <div class="msg-user">
    <div class="bubble">${escHtml(tekst)}</div>
  </div>`;
  chatEl.appendChild(wrap);
  scrollDol(chatEl);
}

export function renderujOdpowiedz(dane) {
  if (dane.debug) {
    return (
      '<div>' +
      escHtml(dane.odpowiedz || '') +
      '</div>' +
      '<div style="margin-top:10px; padding:10px; background:#1a1a1a; color:#ff3b30; font-family:monospace; font-size:11px; border-radius:4px; overflow-x:auto; white-space:pre;">' +
      '<strong>TRACEBACK (ADMIN):</strong>\n' +
      escHtml(dane.debug) +
      '</div>'
    );
  }
  if (dane.punkty) {
    const punktyHtml = dane.punkty.map((item) => '<li>' + escHtml(item) + '</li>').join('');
    const zachetaHtml = dane.zacheta
      ? '<div class="odp-zacheta">💡 ' + escHtml(dane.zacheta) + '</div>'
      : '';
    return (
      '<div class="odp-wstep">' +
      escHtml(dane.wstep) +
      '</div>' +
      '<ul class="odp-punkty">' +
      punktyHtml +
      '</ul>' +
      zachetaHtml
    );
  }
  return '<div>' + escHtml(dane.odpowiedz || '') + '</div>';
}

export function renderujKomunikatBledu(chatEl) {
  const wrap = document.createElement('div');
  wrap.className = 'message-wrap';
  wrap.dataset.ts = new Date().toLocaleString('pl-PL');
  wrap.innerHTML = `
    <div class="msg-bot">
      <div class="bot-avatar"><img src="static/logo.png" alt="Logo"></div>
      <div class="bot-content">
        <div class="bubble">⚠ Serwer niedostępny. Odśwież stronę lub spróbuj za chwilę.</div>
      </div>
    </div>`;
  chatEl.appendChild(wrap);
  scrollDol(chatEl);
}

// Funkcja globalna dla onclick z wewnątrz HTML wygenerowanego przez bota (rozwinTresc)
window.rozwinTresc = function (btn) {
  const div = btn.nextElementSibling;
  div.hidden = !div.hidden;
  btn.textContent = div.hidden ? '▼ pokaż pełny paragraf' : '▲ zwiń';
};

window.kopiujOdpowiedz = async function (btn) {
  try {
    const tekstData = btn.getAttribute('data-copy');
    await navigator.clipboard.writeText(tekstData);
    const oldHtml = btn.innerHTML;
    btn.innerHTML = '✓';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.innerHTML = oldHtml;
      btn.classList.remove('copied');
    }, 2000);
  } catch (err) {
    console.error('Nie udało się skopiować', err);
  }
};
