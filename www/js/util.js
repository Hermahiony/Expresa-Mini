/* ExpresaMini — utilidades: DOM seguro (sin innerHTML), modales, avisos */
(function () {
  const EM = (window.EM = window.EM || {});

  // Crea elementos sin innerHTML: todo texto entra como texto, nunca como código.
  EM.h = function h(tag, props, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === false || v == null) continue;
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    kids.flat(Infinity).forEach(c => {
      if (c == null || c === false) return;
      e.append(c.nodeType ? c : document.createTextNode(String(c)));
    });
    return e;
  };
  EM.$ = s => document.querySelector(s);
  EM.uid = () => Math.random().toString(36).slice(2, 9);
  EM.clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  EM.shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  let toastTimer;
  EM.toast = function (msg) {
    const t = EM.$('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  };

  // Modal accesible: foco inicial, Escape y devolución del foco al cerrar
  EM.modal = function (title, body, opts = {}) {
    const prev = document.activeElement;
    const closeBtn = EM.h('button', { class: 'modal-x', 'aria-label': 'Cerrar', type: 'button' }, '✕');
    const box = EM.h('div', { class: 'modal ' + (opts.cls || ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': title || 'Aviso' },
      closeBtn, title && !opts.hideTitle ? EM.h('h2', { class: 'modal-title' }, title) : null, body);
    const ov = EM.h('div', { class: 'overlay' }, box);
    let closed = false;
    function close() {
      if (closed) return; closed = true;
      document.removeEventListener('keydown', onKey);
      ov.remove();
      if (prev && prev.focus) prev.focus();
      if (opts.onClose) opts.onClose();
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    document.body.append(ov);
    closeBtn.focus();
    return { close, box };
  };

  // Confirmación propia (el confirm() nativo se ve mal en Android)
  EM.ask = function (msg, okLabel = 'Sí') {
    return new Promise(res => {
      let m;
      const done = v => { res(v); m.close(); };
      m = EM.modal('', EM.h('div', { class: 'ask' },
        EM.h('p', { class: 'ask-msg' }, msg),
        EM.h('div', { class: 'row' },
          EM.h('button', { class: 'btn btn-soft', type: 'button', onclick: () => done(false) }, 'Cancelar'),
          EM.h('button', { class: 'btn btn-danger', type: 'button', onclick: () => done(true) }, okLabel))),
        { hideTitle: true, onClose: () => res(false) });
    });
  };
})();
