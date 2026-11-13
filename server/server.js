/* Servidor OPCIONAL del Maestro Virtual. Sin dependencias (Node 18+). La clave de OpenAI vive solo aquí, en .env.
   La app funciona 100 % sin este servidor. */
const http = require('http');
const fs = require('fs');
const path = require('path');

// Lector mínimo de .env (sin dependencias)
try { fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach(l => { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2]; }); } catch (e) {}

const PORT = process.env.PORT || 3000;
const KEY = process.env.OPENAI_API_KEY || '';
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://localhost,http://localhost,capacitor://localhost').split(',').map(s => s.trim());
const MAX_PROMPT = 120, MAX_PER_MIN = 12;

const SYSTEM = `Eres el Maestro Virtual de ExpresaMini, para niñas y niños de 5 a 12 años con autismo, TDAH, sordera o dificultades del habla.
REGLAS:
- Frases cortas y literales (máximo 3). Sin sarcasmo, sin ironías ni expresiones de doble sentido.
- Un solo paso o idea a la vez. Usa 1 o 2 emojis que ayuden a entender.
- Tono calmado, amable y positivo. Nunca regañes ni presiones.
- Termina con una pregunta sencilla de sí o no.
- Si el tema es violento, sexual, político o peligroso, o el niño dice que está en peligro, responde: "Eso es para hablar con un adulto de confianza. 💙 ¿Quieres que llamemos a tu mamá, papá o maestra?"
- No pidas ni aceptes datos personales (apellido, dirección, teléfono, escuela).`;

const OFFLINE = [
  '¡Buena pregunta! 🌟 Vamos paso a paso. ¿Quieres que te lo explique con un ejemplo?',
  '¡Muy bien! ⭐ Aprender es divertido. ¿Quieres saber más?',
  'Estoy aquí contigo. 😊 ¿Puedes decirlo con otras palabras?'
];
const hits = new Map();
function limited(ip) { const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < 60000); a.push(now); hits.set(ip, a); return a.length > MAX_PER_MIN; }

async function openai(path_, body) {
  const r = await fetch('https://api.openai.com/v1/' + path_, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + KEY }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('openai ' + r.status); return r.json();
}

http.createServer(async (req, res) => {
  const origin = req.headers.origin || '';
  const cors = ORIGINS.includes(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' } : {};
  const send = (code, obj) => { res.writeHead(code, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, cors)); res.end(JSON.stringify(obj)); };
  if (req.method === 'OPTIONS') return send(204, {});
  if (req.method !== 'POST' || req.url !== '/api/copilot') return send(404, { error: 'No encontrado' });
  if (limited(req.socket.remoteAddress)) return send(429, { error: 'Muchas preguntas seguidas. Espera un momento.' });

  let raw = ''; for await (const c of req) { raw += c; if (raw.length > 2000) return send(413, { error: 'Mensaje muy largo' }); }
  let prompt = ''; try { prompt = String(JSON.parse(raw).prompt || '').trim().slice(0, MAX_PROMPT); } catch (e) {}
  if (!prompt) return send(400, { error: 'Falta la pregunta' });
  if (!KEY) return send(200, { answer: OFFLINE[Math.floor(Math.random() * OFFLINE.length)] });

  try {
    const mod = await openai('moderations', { model: 'omni-moderation-latest', input: prompt });
    if (mod.results && mod.results[0] && mod.results[0].flagged) return send(200, { answer: 'Eso es para hablar con un adulto de confianza. 💙 ¿Quieres que llamemos a tu mamá, papá o maestra?' });
    const d = await openai('chat/completions', { model: MODEL, max_tokens: 150, temperature: 0.5, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }] });
    send(200, { answer: ((d.choices && d.choices[0] && d.choices[0].message.content) || OFFLINE[0]).trim() });
  } catch (e) { console.error('Error IA:', e.message); send(200, { answer: OFFLINE[0] }); } // nunca se registra lo que escribió el niño
}).listen(PORT, () => console.log('Maestro Virtual en http://localhost:' + PORT + (KEY ? '' : '  (sin OPENAI_API_KEY: respuestas de ejemplo)')));
