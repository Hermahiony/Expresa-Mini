/* ExpresaMini — datos 100 % locales (offline-first). Nada sale del dispositivo. */
(function () {
  const EM = window.EM;
  const P = 'em:';
  const store = (EM.store = {
    get(k, d) { try { const v = localStorage.getItem(P + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(P + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(P + k); } catch (e) {} },
    wipe() { try { Object.keys(localStorage).filter(k => k.startsWith(P)).forEach(k => localStorage.removeItem(k)); } catch (e) {} }
  });

  // ---------- Ajustes ----------
  EM.DEFAULTS = { name: '', rate: 0.9, pitch: 1.05, voiceURI: '', scale: 1, labels: true, speakOnTap: true,
                  muted: false, contrast: false, calm: false, aiUrl: '' };
  EM.settings = Object.assign({}, EM.DEFAULTS, store.get('settings', {}));
  EM.saveSettings = () => store.set('settings', EM.settings);
  EM.applySettings = function () {
    const r = document.documentElement, s = EM.settings;
    r.style.setProperty('--scale', EM.clamp(Number(s.scale) || 1, 0.8, 1.7));
    r.dataset.contrast = s.contrast ? '1' : '0';
    r.dataset.calm = s.calm ? '1' : '0';
    r.dataset.labels = s.labels ? '1' : '0';
  };

  // ---------- Vocabulario (editable por padres) ----------
  const clone = o => JSON.parse(JSON.stringify(o));
  function migrateLegacy(base) {
    // Conserva los pictogramas que el usuario agregó en la versión anterior (clave "expresaData")
    try {
      const old = JSON.parse(localStorage.getItem('expresaData') || 'null');
      if (!old || typeof old !== 'object') return base;
      Object.keys(old).forEach(cid => {
        if (!Array.isArray(old[cid])) return;
        let cat = base.find(c => c.id === cid);
        if (!cat) { cat = { id: cid.slice(0, 24), label: cid.charAt(0).toUpperCase() + cid.slice(1, 20), emoji: '📌', color: '#c8dcf5', items: [] }; base.push(cat); }
        old[cid].forEach(it => {
          if (!it || typeof it.t !== 'string' || typeof it.i !== 'string') return;
          const t = it.t.slice(0, 40), i = it.i.slice(0, 8);
          if (!cat.items.some(x => x.t.toLowerCase() === t.toLowerCase())) cat.items.push({ id: 'u' + EM.uid(), t, i });
        });
      });
    } catch (e) {}
    return base;
  }
  EM.vocab = store.get('vocab', null);
  if (!Array.isArray(EM.vocab) || !EM.vocab.length) { EM.vocab = migrateLegacy(clone(EM.DEFAULT_VOCAB)); store.set('vocab', EM.vocab); }
  EM.saveVocab = () => store.set('vocab', EM.vocab);
  EM.resetVocab = () => { EM.vocab = clone(EM.DEFAULT_VOCAB); EM.saveVocab(); };
  EM.findItem = id => { for (const c of EM.vocab) { const it = c.items.find(x => x.id === id); if (it) return it; } return null; };
  EM.allItems = () => EM.vocab.flatMap(c => c.items);

  // ---------- Aprendizaje local (predicción de la siguiente palabra, sin internet) ----------
  EM.usage = {
    uni: store.get('uni', {}), bi: store.get('bi', {}),
    learn(prevId, id) {
      this.uni[id] = (this.uni[id] || 0) + 1;
      if (prevId) { const m = (this.bi[prevId] = this.bi[prevId] || {}); m[id] = (m[id] || 0) + 1; }
      store.set('uni', this.uni); store.set('bi', this.bi);
    },
    suggest(lastId, n = 5, exclude = []) {
      const score = {};
      if (lastId && this.bi[lastId]) for (const [k, v] of Object.entries(this.bi[lastId])) score[k] = v * 10;
      for (const [k, v] of Object.entries(this.uni)) score[k] = (score[k] || 0) + v;
      return Object.entries(score).sort((a, b) => b[1] - a[1]).map(e => e[0])
        .filter(id => !exclude.includes(id) && EM.findItem(id)).slice(0, n).map(EM.findItem);
    },
    top(n = 10) { return Object.entries(this.uni).sort((a, b) => b[1] - a[1]).map(e => [EM.findItem(e[0]), e[1]]).filter(e => e[0]).slice(0, n); },
    reset() { this.uni = {}; this.bi = {}; store.del('uni'); store.del('bi'); }
  };

  // ---------- Frases favoritas y recientes (guardan ids) ----------
  EM.phrases = {
    favs: store.get('favs', []), recent: store.get('recent', []),
    sameKey: p => p.join('|'),
    toggleFav(ids) {
      const k = this.sameKey(ids), i = this.favs.findIndex(p => this.sameKey(p) === k);
      if (i >= 0) this.favs.splice(i, 1); else this.favs.unshift(ids.slice());
      this.favs = this.favs.slice(0, 40); store.set('favs', this.favs); return i < 0;
    },
    isFav(ids) { const k = this.sameKey(ids); return this.favs.some(p => this.sameKey(p) === k); },
    pushRecent(ids) {
      if (!ids.length) return; const k = this.sameKey(ids);
      this.recent = [ids.slice(), ...this.recent.filter(p => this.sameKey(p) !== k)].slice(0, 15); store.set('recent', this.recent);
    }
  };

  // ---------- Estrellas ----------
  EM.stars = store.get('stars', 0);
  EM.addStars = n => { EM.stars += n; store.set('stars', EM.stars); const e = EM.$('#stars-count'); if (e) e.textContent = EM.stars; };

  // ---------- PIN de adultos: hash con sal (PBKDF2), bloqueo por intentos, sin código de respaldo fijo ----------
  const b64 = bytes => btoa(String.fromCharCode(...bytes));
  async function hash(secret, salt) {
    const enc = new TextEncoder();
    if (window.crypto && crypto.subtle) {
      const key = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 120000, hash: 'SHA-256' }, key, 256);
      return b64(new Uint8Array(bits));
    }
    let x = 5381; const s = salt + secret; for (let i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) | 0; return 'f' + x; // respaldo débil si no hay WebCrypto
  }
  const newSalt = () => b64(crypto.getRandomValues(new Uint8Array(12)));
  const norm = s => String(s).trim().toLowerCase();

  EM.auth = {
    hasPin: () => !!store.get('pin', null),
    question: () => (store.get('pin', {}) || {}).q || '',
    async setPin(pin, q, answer) {
      const salt = newSalt(), asalt = newSalt();
      store.set('pin', { salt, h: await hash(pin, salt), q, asalt, ah: await hash(norm(answer), asalt) });
      store.del('lock');
    },
    lockedFor() { const l = store.get('lock', null); return l && l.until > Date.now() ? Math.ceil((l.until - Date.now()) / 1000) : 0; },
    fail() {
      const l = store.get('lock', { fails: 0, until: 0 }); l.fails++;
      if (l.fails >= 5) { l.until = Date.now() + Math.min(600, 30 * Math.pow(2, l.fails - 5)) * 1000; }
      store.set('lock', l);
    },
    async check(pin) {
      if (this.lockedFor()) return false;
      const r = store.get('pin', null); if (!r) return false;
      const ok = (await hash(pin, r.salt)) === r.h;
      if (ok) store.del('lock'); else this.fail();
      return ok;
    },
    async recover(answer) {
      if (this.lockedFor()) return false;
      const r = store.get('pin', null); if (!r) return false;
      const ok = (await hash(norm(answer), r.asalt)) === r.ah;
      if (ok) { store.del('pin'); store.del('lock'); } else this.fail();
      return ok;
    }
  };

  // ---------- Voz ----------
  const synth = window.speechSynthesis;
  let voice = null;
  EM.voices = () => (synth ? synth.getVoices() : []).filter(v => v.lang && v.lang.toLowerCase().startsWith('es'));
  function pickVoice() {
    const es = EM.voices(); if (!es.length) { voice = null; return; }
    voice = es.find(v => v.voiceURI === EM.settings.voiceURI) || es.find(v => /es[-_]mx/i.test(v.lang)) || es[0];
  }
  if (synth) { pickVoice(); synth.onvoiceschanged = pickVoice; }
  EM.pickVoice = pickVoice;

  EM.speak = function (text) {
    const clean = String(text || '').replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
    if (!clean) return;
    // Indicador visual de que "está hablando" (útil para personas sordas o hipoacúsicas)
    document.body.classList.add('speaking'); clearTimeout(EM._sp); EM._sp = setTimeout(() => document.body.classList.remove('speaking'), 1400);
    if (EM.settings.muted) return;
    const s = EM.settings, T = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.TextToSpeech;
    const web = () => {
      if (!synth) return; const u = new SpeechSynthesisUtterance(clean);
      if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'es-MX';
      u.rate = s.rate; u.pitch = s.pitch; synth.cancel(); synth.speak(u);
    };
    if (T && T.speak) { T.speak({ text: clean, lang: 'es-MX', rate: s.rate, pitch: s.pitch, volume: 1, queueStrategy: 0 }).catch(web); } else web();
  };
})();
