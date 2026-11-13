/* ExpresaMini — panel de adultos: PIN, vocabulario, ajustes, datos y privacidad */
(function () {
  const EM = window.EM, h = EM.h;
  const EMOJIS = Array.from('😊😢😠😨😴🤗🍎🍌🥛🍞🍪💧🚽🛏️🏠🏫🌳🚗🧸⚽🎵📚📱🎨🐶🐱👩👨👧👦👵👴🙋👋🛒🏥💊🤕🦷🛁🧼🍽️🥄👕👟🎒🚌');
  const MAX_VOCAB_BYTES = 2.5e6;
  let box;                                  // contenedor del modal
  const show = node => box.replaceChildren(node);

  function field(label, input) { return h('label', { class: 'field' }, h('span', {}, label), input); }
  const pinInput = (id, ph) => h('input', { type: 'password', inputmode: 'numeric', pattern: '[0-9]*', maxlength: '6', autocomplete: 'off', placeholder: ph || '••••', 'aria-label': ph || 'PIN', id });

  // ---------- Acceso ----------
  function open() {
    const wrap = h('div', {});
    const m = EM.modal('Zona de adultos', wrap, { cls: 'modal-admin' });
    box = wrap; EM.auth.hasPin() ? loginView() : setupView();
    return m;
  }
  function setupView() {
    const p1 = pinInput('p1', 'PIN (4 a 6 números)'), p2 = pinInput('p2', 'Repite el PIN');
    const q = h('select', { 'aria-label': 'Pregunta de seguridad' }, ['¿Cómo se llama tu primera mascota?', '¿En qué ciudad naciste?', '¿Cuál es tu comida favorita?'].map(t => h('option', { value: t }, t)));
    const a = h('input', { type: 'text', maxlength: '40', autocomplete: 'off', 'aria-label': 'Respuesta' });
    const err = h('p', { class: 'err', role: 'alert' });
    show(h('div', { class: 'stack' },
      h('p', {}, 'Crea un PIN para que solo los adultos entren aquí. La pregunta de seguridad sirve para recuperarlo.'),
      field('PIN', p1), field('Repite el PIN', p2), field('Pregunta de seguridad', q), field('Tu respuesta', a), err,
      h('button', { class: 'btn btn-go', type: 'button', onclick: async () => {
        if (!/^\d{4,6}$/.test(p1.value)) return (err.textContent = 'El PIN debe tener de 4 a 6 números.');
        if (p1.value !== p2.value) return (err.textContent = 'Los dos PIN no coinciden.');
        if (a.value.trim().length < 2) return (err.textContent = 'Escribe una respuesta de seguridad.');
        await EM.auth.setPin(p1.value, q.value, a.value); EM.toast('PIN guardado'); panel('vocab');
      } }, 'Guardar PIN')));
  }
  function loginView() {
    const p = pinInput('lp', 'PIN'); const err = h('p', { class: 'err', role: 'alert' });
    async function go() {
      const w = EM.auth.lockedFor(); if (w) return (err.textContent = 'Demasiados intentos. Espera ' + w + ' segundos.');
      if (await EM.auth.check(p.value)) panel('vocab'); else { const w2 = EM.auth.lockedFor(); err.textContent = w2 ? 'Demasiados intentos. Espera ' + w2 + ' segundos.' : 'PIN incorrecto.'; p.value = ''; }
    }
    p.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    show(h('div', { class: 'stack center' }, h('div', { class: 'big-emoji', 'aria-hidden': 'true' }, '🔐'), field('Escribe tu PIN', p), err,
      h('button', { class: 'btn btn-go', type: 'button', onclick: go }, 'Entrar'),
      h('button', { class: 'btn btn-link', type: 'button', onclick: recoverView }, 'Olvidé mi PIN')));
    p.focus();
  }
  function recoverView() {
    const a = h('input', { type: 'text', maxlength: '40', autocomplete: 'off', 'aria-label': 'Respuesta' }); const err = h('p', { class: 'err', role: 'alert' });
    show(h('div', { class: 'stack' }, h('p', {}, EM.auth.question()), a, err,
      h('button', { class: 'btn btn-go', type: 'button', onclick: async () => {
        const w = EM.auth.lockedFor(); if (w) return (err.textContent = 'Espera ' + w + ' segundos.');
        if (await EM.auth.recover(a.value)) { EM.toast('Respuesta correcta. Crea un PIN nuevo.'); setupView(); } else err.textContent = 'Respuesta incorrecta.';
      } }, 'Recuperar acceso'),
      h('button', { class: 'btn btn-link', type: 'button', onclick: loginView }, 'Volver')));
  }

  // ---------- Panel ----------
  function panel(tab) {
    const tabs = [['vocab', '🧩 Símbolos'], ['settings', '⚙️ Ajustes'], ['data', '🔒 Datos y privacidad']];
    const body = h('div', { class: 'admin-body' });
    show(h('div', {}, h('div', { class: 'seg seg-wrap', role: 'tablist' }, tabs.map(([id, t]) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(id === tab), class: id === tab ? 'on' : '', onclick: () => panel(id) }, t))), body));
    ({ vocab: vocabTab, settings: settingsTab, data: dataTab })[tab](body);
  }

  // ---------- Símbolos ----------
  function readImage(file) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => { const im = new Image(); im.onload = () => { const r = Math.min(1, 256 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * r)); c.height = Math.max(1, Math.round(im.height * r)); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.8)); }; im.onerror = rej; im.src = fr.result; };
      fr.onerror = rej; fr.readAsDataURL(file);
    });
  }
  function vocabTab(body) {
    let catId = (EM.vocab[0] || {}).id, img = null, emoji = '';
    const draw = () => {
      const cat = EM.vocab.find(c => c.id === catId) || EM.vocab[0]; if (!cat) return;
      const word = h('input', { type: 'text', maxlength: '40', placeholder: 'Palabra o frase corta', 'aria-label': 'Palabra' });
      const emo = h('input', { type: 'text', maxlength: '8', placeholder: 'Emoji', 'aria-label': 'Emoji', value: emoji });
      const file = h('input', { type: 'file', accept: 'image/*', class: 'sr-only', id: 'photo-in', 'aria-label': 'Foto' });
      const preview = h('span', { class: 'photo-state' }, img ? '📷 Foto lista' : '');
      file.addEventListener('change', async () => { if (file.files[0]) { try { img = await readImage(file.files[0]); preview.textContent = '📷 Foto lista'; } catch (e) { EM.toast('No pude leer esa foto'); } } });
      const picker = h('div', { class: 'emoji-pick', role: 'group', 'aria-label': 'Emojis sugeridos' }, EMOJIS.map(e => h('button', { type: 'button', 'aria-label': e, onclick: () => { emoji = e; emo.value = e; } }, e)));
      body.replaceChildren(
        h('div', { class: 'chips' }, EM.vocab.map(c => h('button', { type: 'button', class: 'chipbtn' + (c.id === cat.id ? ' on' : ''), onclick: () => { catId = c.id; draw(); } }, c.emoji + ' ' + c.label))),
        h('div', { class: 'add-form' }, word, emo, picker,
          h('div', { class: 'row' }, h('label', { class: 'btn btn-soft', for: 'photo-in' }, '📷 Usar foto'), file, preview),
          h('button', { class: 'btn btn-go', type: 'button', onclick: () => {
            const t = word.value.trim().slice(0, 40), i = (emo.value || emoji).trim().slice(0, 8);
            if (!t) return EM.toast('Escribe una palabra'); if (!i && !img) return EM.toast('Elige un emoji o una foto');
            if (cat.items.length >= 60) return EM.toast('Esta categoría ya tiene 60 símbolos');
            const it = { id: 'u' + EM.uid(), t, i: i || '🖼️' }; if (img) it.img = img;
            cat.items.push(it); EM.saveVocab(); img = null; emoji = ''; EM.renderAll(); EM.toast('Agregado'); draw();
          } }, '+ Agregar a ' + cat.label)),
        h('ul', { class: 'admin-list' }, cat.items.map((it, idx) => h('li', {},
          it.img ? h('img', { src: it.img, alt: '', class: 'thumb' }) : h('span', { 'aria-hidden': 'true', class: 'thumb-e' }, it.i), h('span', { class: 'li-t' }, it.t),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Borrar ' + it.t, onclick: async () => { if (await EM.ask('¿Borrar “' + it.t + '”?', 'Borrar')) { cat.items.splice(idx, 1); EM.saveVocab(); EM.renderAll(); draw(); } } }, '🗑️')))),
        h('button', { class: 'btn btn-link', type: 'button', onclick: async () => { if (await EM.ask('Se restaurarán todos los símbolos originales y se borrarán los que agregaste.', 'Restaurar')) { EM.resetVocab(); EM.renderAll(); panel('vocab'); } } }, 'Restaurar símbolos originales'));
    };
    draw();
  }

  // ---------- Ajustes ----------
  function settingsTab(body) {
    const s = EM.settings, save = () => { EM.saveSettings(); EM.applySettings(); EM.renderAll(); };
    const slider = (label, key, min, max, step) => field(label, h('input', { type: 'range', min, max, step, value: s[key], 'aria-label': label, oninput: e => { s[key] = Number(e.target.value); save(); } }));
    const check = (label, key) => h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: s[key] ? true : null, onchange: e => { s[key] = e.target.checked; save(); } }), h('span', {}, label));
    const voices = EM.voices();
    const sel = h('select', { 'aria-label': 'Voz', onchange: e => { s.voiceURI = e.target.value; EM.saveSettings(); EM.pickVoice(); } },
      h('option', { value: '' }, voices.length ? 'Automática' : 'Voz del sistema'), voices.map(v => h('option', { value: v.voiceURI, selected: v.voiceURI === s.voiceURI ? true : null }, v.name + ' (' + v.lang + ')')));
    body.replaceChildren(h('div', { class: 'stack' },
      field('Nombre del niño o niña', h('input', { type: 'text', maxlength: '20', value: s.name, oninput: e => { s.name = e.target.value.replace(/[<>]/g, ''); EM.saveSettings(); $g('#greeting').textContent = s.name ? 'Hola, ' + s.name : 'Hola'; } })),
      field('Voz', sel), slider('Velocidad de la voz', 'rate', 0.5, 1.5, 0.1), slider('Tono de la voz', 'pitch', 0.5, 2, 0.1),
      h('button', { class: 'btn btn-soft', type: 'button', onclick: () => EM.speak('Hola, así suena mi voz.') }, '🔊 Probar voz'),
      slider('Tamaño de los símbolos y letras', 'scale', 0.9, 1.6, 0.1),
      check('Mostrar texto debajo de cada símbolo', 'labels'), check('Decir cada palabra al tocarla', 'speakOnTap'),
      check('Modo silencio (solo visual, con aviso en pantalla)', 'muted'), check('Alto contraste', 'contrast'), check('Modo calma (sin animaciones, colores suaves)', 'calm')));
  }
  const $g = EM.$;

  // ---------- Datos y privacidad ----------
  function sanitizeVocab(v) {
    if (!Array.isArray(v)) throw new Error('formato');
    const str = (x, n) => (typeof x === 'string' ? x.replace(/[<>]/g, '').slice(0, n) : '');
    const out = v.slice(0, 30).map(c => ({ id: str(c.id, 24) || 'c' + EM.uid(), label: str(c.label, 20) || 'Categoría', emoji: str(c.emoji, 8) || '📌', color: /^#[0-9a-f]{6}$/i.test(c.color) ? c.color : '#c8dcf5',
      items: (Array.isArray(c.items) ? c.items : []).slice(0, 60).map(it => { const o = { id: str(it.id, 24) || 'u' + EM.uid(), t: str(it.t, 40), i: str(it.i, 8) }; if (typeof it.img === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(it.img) && it.img.length < 200000) o.img = it.img; return o; }).filter(o => o.t) }));
    if (!out.length) throw new Error('vacío'); return out;
  }
  function dataTab(body) {
    const s = EM.settings;
    const area = h('textarea', { rows: '5', 'aria-label': 'Copia de seguridad', spellcheck: 'false', placeholder: 'Aquí aparece la copia de seguridad. Para restaurar, pega una copia y toca “Importar”.' });
    const top = EM.usage.top(8);
    const ai = h('input', { type: 'url', placeholder: 'https://tu-servidor.com', value: s.aiUrl, 'aria-label': 'Dirección del servidor del Maestro', onchange: e => { const v = e.target.value.trim(); if (v && !/^https:\/\//i.test(v)) { EM.toast('La dirección debe empezar con https://'); e.target.value = s.aiUrl; return; } s.aiUrl = v.replace(/\/$/, ''); EM.saveSettings(); EM.toast(v ? 'Maestro Virtual activado' : 'Maestro Virtual apagado'); } });
    body.replaceChildren(h('div', { class: 'stack' },
      h('p', { class: 'priv' }, '🔒 ExpresaMini guarda todo (nombre, símbolos, frases y uso) solo en este teléfono. No hay cuentas ni nube. El Maestro Virtual está apagado a menos que un adulto lo active abajo.'),
      h('h3', {}, 'Palabras que más usa'),
      top.length ? h('ol', { class: 'top-list' }, top.map(([it, n]) => h('li', {}, it.i + ' ' + it.t + ' — ' + n + (n === 1 ? ' vez' : ' veces')))) : h('p', { class: 'hint' }, 'Todavía no hay datos de uso.'),
      h('h3', {}, 'Copia de seguridad'), area,
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-soft', type: 'button', onclick: () => { area.value = JSON.stringify({ app: 'ExpresaMini', v: 2, vocab: EM.vocab, favs: EM.phrases.favs, uni: EM.usage.uni, bi: EM.usage.bi, settings: Object.assign({}, s, { aiUrl: '' }) }); area.select(); } }, 'Exportar'),
        h('button', { class: 'btn btn-soft', type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(area.value); EM.toast('Copiado'); } catch (e) { area.select(); EM.toast('Selecciona y copia el texto'); } } }, 'Copiar'),
        h('button', { class: 'btn btn-go', type: 'button', onclick: () => {
          try {
            if (area.value.length > MAX_VOCAB_BYTES) throw new Error('grande'); const d = JSON.parse(area.value); if (d.app !== 'ExpresaMini') throw new Error('app');
            EM.vocab = sanitizeVocab(d.vocab); EM.saveVocab();
            if (Array.isArray(d.favs)) { EM.phrases.favs = d.favs.slice(0, 40).map(p => Array.isArray(p) ? p.filter(x => typeof x === 'string').slice(0, 20) : []); EM.store.set('favs', EM.phrases.favs); }
            EM.renderAll(); EM.toast('Copia importada');
          } catch (e) { EM.toast('La copia no es válida'); }
        } }, 'Importar')),
      h('h3', {}, 'Maestro Virtual (opcional)'), h('p', { class: 'hint' }, 'Si lo enciendes, lo que el niño escriba al Maestro se envía a tu servidor (carpeta “server”). Déjalo vacío para mantenerlo apagado.'), ai,
      h('h3', {}, 'Seguridad'),
      h('button', { class: 'btn btn-soft', type: 'button', onclick: () => { EM.store.del('pin'); setupView(); } }, 'Cambiar PIN'),
      h('button', { class: 'btn btn-danger', type: 'button', onclick: async () => { if (await EM.ask('Se borrarán el nombre, los símbolos agregados, las frases, el aprendizaje y el PIN de este teléfono. No se puede deshacer.', 'Borrar todo')) { EM.store.wipe(); location.reload(); } } }, 'Borrar todos los datos')));
  }

  EM.admin = { open };
})();
