/* ExpresaMini — juegos: memoria y matemáticas (5 niveles cada uno) */
(function () {
  const EM = window.EM, h = EM.h;
  let box, m;
  const set = n => box.replaceChildren(n);
  const back = () => h('button', { class: 'btn btn-soft', type: 'button', onclick: menu }, '← Juegos');
  const cheer = () => { const t = ['¡Lo lograste!', '¡Muy bien!', '¡Excelente!', '¡Sigue así!']; EM.speak(t[Math.floor(Math.random() * t.length)]); };

  function open() { box = h('div', {}); m = EM.modal('Juegos', box, { cls: 'modal-big' }); menu(); }
  function menu() {
    const g = (icon, name, fn) => h('button', { class: 'game-card', type: 'button', onclick: fn }, h('span', { class: 'g-icon', 'aria-hidden': 'true' }, icon), h('span', {}, name));
    set(h('div', {}, h('p', { class: 'stars-line' }, '⭐ ', h('b', {}, String(EM.stars)), ' estrellas'),
      h('div', { class: 'game-grid' },
        g('🧠', 'Memoria', () => levels('Memoria', memory)), g('➕', 'Suma', () => levels('Suma', l => math('+', l))),
        g('➖', 'Resta', () => levels('Resta', l => math('-', l))), g('✖️', 'Multiplicación', () => levels('Multiplicación', l => math('*', l))),
        g('➗', 'División', () => levels('División', l => math('/', l))))));
  }
  function levels(title, play) {
    set(h('div', {}, back(), h('h3', {}, title + ': elige un nivel'),
      h('div', { class: 'lvl-grid' }, [1, 2, 3, 4, 5].map(l => h('button', { class: 'lvl', type: 'button', 'aria-label': 'Nivel ' + l, onclick: () => play(l) }, String(l))))));
  }

  // ----- Memoria -----
  function memory(level) {
    const pool = EM.allItems().filter(i => !i.img);
    const pairs = EM.shuffle(pool).slice(0, 2 + level);
    const cards = EM.shuffle(pairs.concat(pairs).map((it, k) => ({ it, k })));
    let open = [], found = 0, lock = false;
    const grid = h('div', { class: 'mem-grid' });
    cards.forEach(c => {
      const b = h('button', { class: 'mem', type: 'button', 'aria-label': 'Carta boca abajo' }, '❓');
      c.el = b;
      b.addEventListener('click', () => {
        if (lock || c.done || open.includes(c)) return;
        b.textContent = c.it.i; b.classList.add('up'); b.setAttribute('aria-label', c.it.t); open.push(c);
        if (open.length === 2) {
          lock = true;
          const [a, z] = open;
          if (a.it.id === z.it.id) { a.done = z.done = true; found++; open = []; lock = false; EM.speak(a.it.t); if (found === pairs.length) win(level); }
          else setTimeout(() => { [a, z].forEach(x => { x.el.textContent = '❓'; x.el.classList.remove('up'); x.el.setAttribute('aria-label', 'Carta boca abajo'); }); open = []; lock = false; }, 900);
        }
      });
      grid.append(b);
    });
    set(h('div', {}, back(), h('h3', {}, 'Memoria · Nivel ' + level), h('p', { class: 'hint' }, 'Encuentra las parejas iguales.'), grid));
  }
  function win(level) { EM.addStars(level); cheer(); EM.toast('+' + level + ' ⭐'); setTimeout(() => set(h('div', { class: 'stack center' }, h('div', { class: 'big-emoji', 'aria-hidden': 'true' }, '🎉'), h('h3', {}, '¡Ganaste!'), back())), 600); }

  // ----- Matemáticas: 5 preguntas por ronda -----
  function make(op, l) {
    const r = n => 1 + Math.floor(Math.random() * n);
    let a, b, ans;
    if (op === '+') { a = r(3 + l * 3); b = r(3 + l * 3); ans = a + b; }
    else if (op === '-') { a = r(4 + l * 4); b = r(a); ans = a - b; }
    else if (op === '*') { a = r(l + 2); b = r(l + 2); ans = a * b; }
    else { b = r(l + 1) + 1; ans = r(l + 2); a = b * ans; }
    return { a, b, ans, sym: { '+': '+', '-': '−', '*': '×', '/': '÷' }[op] };
  }
  function math(op, level) {
    let n = 0, score = 0;
    const next = () => {
      if (n === 5) { EM.addStars(score); cheer(); return set(h('div', { class: 'stack center' }, h('div', { class: 'big-emoji', 'aria-hidden': 'true' }, score >= 4 ? '🎉' : '👏'), h('h3', {}, 'Acertaste ' + score + ' de 5'), h('p', {}, '+' + score + ' ⭐'), back())); }
      n++;
      const q = make(op, level), opts = new Set([q.ans]);
      while (opts.size < 3) opts.add(Math.max(0, q.ans + Math.floor(Math.random() * 7) - 3));
      const dots = (op === '+' || op === '-') && q.a <= 10 ? h('p', { class: 'dots', 'aria-hidden': 'true' }, '🍎'.repeat(q.a) + (op === '+' ? ' + ' + '🍎'.repeat(q.b) : '')) : null;
      const fb = h('p', { class: 'fb', role: 'status' });
      set(h('div', {}, back(), h('p', { class: 'hint' }, 'Pregunta ' + n + ' de 5'), dots,
        h('p', { class: 'eq' }, q.a + ' ' + q.sym + ' ' + q.b + ' = ?'),
        h('div', { class: 'opt-grid' }, EM.shuffle(Array.from(opts)).map(o => h('button', { class: 'opt', type: 'button', onclick: e => {
          if (o === q.ans) { score++; fb.textContent = '¡Correcto!'; EM.speak('Correcto'); } else { fb.textContent = 'La respuesta era ' + q.ans; EM.speak('Casi. La respuesta era ' + q.ans); }
          document.querySelectorAll('.opt').forEach(b => { b.disabled = true; }); setTimeout(next, 1100);
        } }, String(o)))), fb));
    };
    next();
  }
  EM.games = { open };
})();
