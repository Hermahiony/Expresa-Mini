/* ExpresaMini — interfaz principal de comunicación (CAA) */
(function () {
  const EM = window.EM, h = EM.h, $ = EM.$;
  let message = [];            // símbolos elegidos
  let currentCat = EM.vocab[0].id;

  const colorOf = c => c.color || '#c8dcf5';
  const symbol = it => it.img ? h('img', { class: 'p-img', src: it.img, alt: '' }) : h('span', { class: 'p-icon', 'aria-hidden': 'true' }, it.i);
  const phraseText = items => items.map(m => m.t).join(' ');
  const idsToItems = ids => ids.map(EM.findItem).filter(Boolean);

  // ---------- Mensaje ----------
  function renderMessage() {
    const box = $('#msg'); box.replaceChildren();
    if (!message.length) box.append(h('span', { class: 'placeholder' }, 'Toca los símbolos para armar tu mensaje'));
    message.forEach(m => box.append(h('div', { class: 'chip' }, symbol(m), h('span', { class: 'chip-t' }, m.t))));
    box.scrollLeft = box.scrollWidth;
    const has = message.length > 0;
    ['#btn-back', '#btn-clear', '#btn-fav', '#btn-show'].forEach(s => { $(s).disabled = !has; });
    $('#btn-fav').textContent = has && EM.phrases.isFav(message.map(m => m.id)) ? '★' : '☆';
    renderSuggest();
  }
  function renderSuggest() {
    const box = $('#suggest'); box.replaceChildren();
    const last = message[message.length - 1];
    const list = EM.usage.suggest(last && last.id, 5, message.map(m => m.id));
    if (!list.length) return;
    box.append(h('span', { class: 'suggest-label' }, 'Podrías decir:'));
    list.forEach(it => box.append(h('button', { class: 'sug', type: 'button', 'aria-label': 'Agregar ' + it.t, onclick: () => pick(it) }, symbol(it), h('span', {}, it.t))));
  }
  function pick(it, fromQuick) {
    const prev = message[message.length - 1];
    EM.usage.learn(prev && prev.id, it.id);
    if (fromQuick) { EM.speak(it.t); message = [it]; } else { message.push(it); if (EM.settings.speakOnTap) EM.speak(it.t); }
    renderMessage();
  }
  function say() {
    if (!message.length) return;
    EM.speak(phraseText(message)); EM.phrases.pushRecent(message.map(m => m.id));
  }

  // ---------- Pantalla principal ----------
  function renderQuick() {
    const box = $('#quick'); box.replaceChildren();
    EM.QUICK.map(EM.findItem).filter(Boolean).forEach(it =>
      box.append(h('button', { class: 'quick-btn', type: 'button', 'aria-label': 'Decir ' + it.t, onclick: () => pick(it, true) }, symbol(it), h('span', {}, it.t))));
  }
  function renderTabs() {
    const box = $('#tabs'); box.replaceChildren();
    EM.vocab.forEach(c => box.append(h('button', { class: 'tab' + (c.id === currentCat ? ' on' : ''), role: 'tab', type: 'button',
      'aria-selected': String(c.id === currentCat), style: '--c:' + colorOf(c), onclick: () => { currentCat = c.id; renderTabs(); renderGrid(); } },
      h('span', { 'aria-hidden': 'true' }, c.emoji), h('span', {}, c.label))));
  }
  function renderGrid() {
    const g = $('#grid'); g.replaceChildren();
    const cat = EM.vocab.find(c => c.id === currentCat) || EM.vocab[0]; if (!cat) return;
    g.style.setProperty('--c', colorOf(cat));
    if (!cat.items.length) g.append(h('p', { class: 'empty' }, 'Esta categoría está vacía. Un adulto puede agregar símbolos en Padres.'));
    cat.items.forEach(it => g.append(h('button', { class: 'card', type: 'button', 'aria-label': it.t, onclick: () => pick(it) }, symbol(it), h('span', { class: 'p-text' }, it.t))));
  }
  function renderAll() {
    if (!EM.vocab.some(c => c.id === currentCat)) currentCat = (EM.vocab[0] || {}).id;
    EM.applySettings();
    $('#greeting').textContent = EM.settings.name ? 'Hola, ' + EM.settings.name : 'Hola';
    $('#stars-count').textContent = EM.stars;
    renderQuick(); renderTabs(); renderGrid(); renderMessage();
  }
  EM.renderAll = renderAll;

  // ---------- Mostrar mensaje en pantalla grande (para quien no oye) ----------
  function showBig() {
    if (!message.length) return;
    const body = h('div', { class: 'big' },
      h('div', { class: 'big-symbols' }, message.map(m => h('div', { class: 'big-item' }, symbol(m)))),
      h('p', { class: 'big-text', lang: 'es' }, phraseText(message)),
      h('button', { class: 'btn btn-go', type: 'button', onclick: say }, '🔊 Decir en voz alta'));
    EM.modal('Mensaje', body, { cls: 'modal-big', hideTitle: true });
  }

  // ---------- Frases guardadas ----------
  function openPhrases() {
    const list = h('div', { class: 'phrase-list' });
    let tab = 'favs';
    const tabs = h('div', { class: 'seg' });
    function draw() {
      tabs.replaceChildren(
        h('button', { type: 'button', class: tab === 'favs' ? 'on' : '', onclick: () => { tab = 'favs'; draw(); } }, '⭐ Favoritas'),
        h('button', { type: 'button', class: tab === 'recent' ? 'on' : '', onclick: () => { tab = 'recent'; draw(); } }, '🕘 Recientes'));
      list.replaceChildren();
      const src = tab === 'favs' ? EM.phrases.favs : EM.phrases.recent;
      const rows = src.map(ids => idsToItems(ids)).filter(i => i.length);
      if (!rows.length) list.append(h('p', { class: 'empty' }, tab === 'favs' ? 'Aún no hay favoritas. Arma un mensaje y toca ☆.' : 'Aquí aparecerán tus últimos mensajes.'));
      rows.forEach(items => list.append(h('button', { class: 'phrase', type: 'button', onclick: () => { message = items.slice(); m.close(); renderMessage(); say(); } },
        h('span', { class: 'phrase-sym', 'aria-hidden': 'true' }, items.map(symbol)), h('span', {}, phraseText(items)))));
    }
    const m = EM.modal('Mis frases', h('div', {}, tabs, list)); draw();
  }

  // ---------- Escuchar (voz → texto) para personas sordas o hipoacúsicas ----------
  function openListen() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const out = h('p', { class: 'listen-out', 'aria-live': 'polite' }, SR ? 'Toca “Escuchar” y pide que te hablen cerca del teléfono.' : '');
    const btn = h('button', { class: 'btn btn-go', type: 'button' }, '👂 Escuchar');
    let rec = null, on = false;
    const note = h('p', { class: 'hint' }, SR ? 'Necesita internet en la mayoría de dispositivos Android. Funciona mejor en un lugar tranquilo.'
      : 'Este dispositivo no permite transcribir voz. Prueba con Google Chrome o activa el reconocimiento de voz de Android.');
    function stop() { on = false; btn.textContent = '👂 Escuchar'; if (rec) { try { rec.stop(); } catch (e) {} } }
    if (SR) btn.addEventListener('click', () => {
      if (on) return stop();
      rec = new SR(); rec.lang = 'es-MX'; rec.continuous = true; rec.interimResults = true;
      rec.onresult = e => { out.textContent = Array.from(e.results).map(r => r[0].transcript).join(' '); };
      rec.onerror = () => { out.textContent = 'No pude escuchar. Revisa el permiso del micrófono y la conexión.'; stop(); };
      rec.onend = () => { if (on) stop(); };
      try { rec.start(); on = true; btn.textContent = '⏹️ Detener'; out.textContent = 'Escuchando…'; } catch (e) { stop(); }
    }); else btn.disabled = true;
    EM.modal('Escuchar', h('div', { class: 'listen' }, out, btn, note), { cls: 'modal-big', onClose: stop });
  }

  // ---------- Maestro Virtual (opcional; un adulto debe activarlo) ----------
  function openMaestro() {
    const url = (EM.settings.aiUrl || '').replace(/\/$/, '');
    if (!url) return EM.modal('Maestro Virtual', h('div', { class: 'maestro-off' },
      h('p', { class: 'big-emoji', 'aria-hidden': 'true' }, '🤖'),
      h('p', {}, 'El Maestro Virtual está apagado. Un adulto puede encenderlo en Padres → Datos y privacidad.'),
      h('p', { class: 'hint' }, 'Mientras tanto, toda la comunicación funciona sin internet.')));
    const log = h('div', { class: 'chat-log', 'aria-live': 'polite' }, h('div', { class: 'bot' }, '¡Hola! Soy tu Maestro. Pregúntame algo corto. 😊'));
    const input = h('input', { type: 'text', maxlength: '120', placeholder: 'Escribe aquí…', 'aria-label': 'Tu pregunta', autocomplete: 'off' });
    const send = h('button', { class: 'btn btn-go', type: 'button' }, '🚀');
    async function go() {
      const q = input.value.trim(); if (!q) return; input.value = '';
      log.append(h('div', { class: 'me' }, q));
      const wait = h('div', { class: 'bot' }, '…'); log.append(wait); log.scrollTop = log.scrollHeight;
      let ans = 'No pude conectarme ahora. Intenta de nuevo más tarde. 🙂';
      try {
        const r = await fetch(url + '/api/copilot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: q, mode: 'tutor' }) });
        if (r.ok) { const d = await r.json(); if (d && typeof d.answer === 'string') ans = d.answer.slice(0, 400); }
      } catch (e) {}
      wait.textContent = ans; log.scrollTop = log.scrollHeight; EM.speak(ans); EM.addStars(1);
    }
    send.addEventListener('click', go); input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    EM.modal('Maestro Virtual', h('div', { class: 'chat' }, log, h('div', { class: 'row' }, input, send)));
  }

  // ---------- Bienvenida ----------
  function welcome(first) {
    const input = h('input', { type: 'text', maxlength: '20', placeholder: 'Tu nombre', 'aria-label': 'Tu nombre', value: EM.settings.name || '', autocomplete: 'off' });
    const m = EM.modal('', h('div', { class: 'welcome' },
      h('img', { src: 'assets/logo.png', alt: '', class: 'welcome-logo' }),
      h('h2', {}, '¡Hola!'), h('p', {}, '¿Cómo te llamas?'), input,
      h('button', { class: 'btn btn-go', type: 'button', onclick: () => save(input.value.trim()) }, 'Empezar'),
      h('button', { class: 'btn btn-link', type: 'button', onclick: () => save('') }, 'Usar sin nombre'),
      h('p', { class: 'hint' }, '🔒 Todo se guarda solo en este dispositivo.')), { hideTitle: true, onClose: () => { EM.store.set('welcomed', true); } });
    function save(n) { EM.settings.name = n.replace(/[<>]/g, '').slice(0, 20); EM.saveSettings(); EM.store.set('welcomed', true); m.close(); renderAll(); }
  }

  // ---------- Arranque ----------
  function start() {
    $('#btn-speak').addEventListener('click', say);
    $('#btn-back').addEventListener('click', () => { message.pop(); renderMessage(); });
    $('#btn-clear').addEventListener('click', () => { message = []; renderMessage(); });
    $('#btn-fav').addEventListener('click', () => { if (!message.length) return; const on = EM.phrases.toggleFav(message.map(m => m.id)); EM.toast(on ? 'Frase guardada en favoritas' : 'Frase quitada de favoritas'); renderMessage(); });
    $('#btn-show').addEventListener('click', showBig);
    $('#nav-phrases').addEventListener('click', openPhrases);
    $('#nav-listen').addEventListener('click', openListen);
    $('#nav-games').addEventListener('click', () => EM.games.open());
    $('#nav-maestro').addEventListener('click', openMaestro);
    $('#nav-admin').addEventListener('click', () => EM.admin.open());
    $('#brand').addEventListener('click', () => welcome(false));
    renderAll();
    setTimeout(() => { const s = $('#splash'); s.classList.add('hide'); setTimeout(() => s.remove(), 400); }, 500);
    if (!EM.store.get('welcomed', false)) welcome(true);
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  document.addEventListener('DOMContentLoaded', start);
})();
