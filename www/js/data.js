/* ExpresaMini — vocabulario base. Cada símbolo: id estable, t = texto que se dice, i = emoji. */
(function () {
  const S = (id, t, i) => ({ id, t, i });
  window.EM = window.EM || {};
  EM.DEFAULT_VOCAB = [
    { id: 'basico', label: 'Básico', emoji: '⭐', color: '#e2c08d', items: [
      S('si', 'Sí', '✅'), S('no', 'No', '❌'), S('mas', 'Más', '➕'), S('terminado', 'Terminé', '🏁'),
      S('espera', 'Espera', '✋'), S('gracias', 'Gracias', '🙏'), S('porfavor', 'Por favor', '🤲'),
      S('ayuda', 'Ayuda', '🆘'), S('otra', 'Otra vez', '🔁'), S('listo', 'Listo', '👍'), S('noentiendo', 'No entiendo', '🤷') ] },
    { id: 'emociones', label: 'Emociones', emoji: '😊', color: '#f2d1a8', items: [
      S('feliz', 'Feliz', '😊'), S('triste', 'Triste', '😢'), S('enojado', 'Enojado', '😠'), S('miedo', 'Miedo', '😨'),
      S('cansado', 'Cansado', '😴'), S('nervioso', 'Nervioso', '😬'), S('tranquilo', 'Tranquilo', '😌'),
      S('emocionado', 'Emocionado', '🤩'), S('aburrido', 'Aburrido', '😐'), S('sorprendido', 'Sorprendido', '😮'), S('abrazo', 'Quiero un abrazo', '🤗') ] },
    { id: 'necesidades', label: 'Necesidades', emoji: '💧', color: '#b4d4e6', items: [
      S('agua', 'Agua', '💧'), S('comer', 'Comer', '🍎'), S('bano', 'Baño', '🚽'), S('dormir', 'Dormir', '💤'),
      S('descansar', 'Descansar', '🛋️'), S('silencio', 'Silencio', '🤫'), S('ruido', 'Hay mucho ruido', '🔊'),
      S('calor', 'Tengo calor', '🥵'), S('frio', 'Tengo frío', '🥶'), S('medicina', 'Medicina', '💊'), S('espacio', 'Quiero estar solo', '🧘') ] },
    { id: 'dolor', label: 'Me duele', emoji: '🤕', color: '#f2d1d1', items: [
      S('duele', 'Me duele', '🤕'), S('cabeza', 'Cabeza', '🧠'), S('panza', 'Panza', '🤢'), S('garganta', 'Garganta', '😷'),
      S('oido', 'Oído', '👂'), S('diente', 'Diente', '🦷'), S('ojo', 'Ojo', '👁️'), S('mano', 'Mano', '✋'), S('pie', 'Pie', '🦶'), S('mareo', 'Mareo', '😵') ] },
    { id: 'personas', label: 'Personas', emoji: '👨‍👩‍👧', color: '#bde4d8', items: [
      S('yo', 'Yo', '🙋'), S('tu', 'Tú', '👉'), S('mama', 'Mamá', '👩'), S('papa', 'Papá', '👨'), S('abuela', 'Abuela', '👵'),
      S('abuelo', 'Abuelo', '👴'), S('hermano', 'Hermano', '🧒'), S('maestra', 'Maestra', '👩‍🏫'), S('amigo', 'Amigo', '🧑‍🤝‍🧑'), S('doctor', 'Doctor', '🧑‍⚕️') ] },
    { id: 'acciones', label: 'Acciones', emoji: '🧸', color: '#a2b9e7', items: [
      S('quiero', 'Quiero', '🙌'), S('noquiero', 'No quiero', '🙅'), S('jugar', 'Jugar', '🧸'), S('beber', 'Beber', '🥤'),
      S('ir', 'Ir', '🚶'), S('ver', 'Ver', '👀'), S('escuchar', 'Escuchar', '👂'), S('dibujar', 'Dibujar', '🎨'), S('leer', 'Leer', '📖'),
      S('abrir', 'Abrir', '🔓'), S('dame', 'Dame', '🫴'), S('parar', 'Parar', '🛑') ] },
    { id: 'lugares', label: 'Lugares', emoji: '🏠', color: '#c8dcf5', items: [
      S('casa', 'Casa', '🏠'), S('escuela', 'Escuela', '🏫'), S('parque', 'Parque', '🌳'), S('tienda', 'Tienda', '🛒'),
      S('hospital', 'Hospital', '🏥'), S('carro', 'Carro', '🚗'), S('cuarto', 'Mi cuarto', '🛏️'), S('cocina', 'Cocina', '🍳') ] },
    { id: 'comida', label: 'Comida', emoji: '🍎', color: '#f5dcc0', items: [
      S('manzana', 'Manzana', '🍎'), S('platano', 'Plátano', '🍌'), S('galleta', 'Galleta', '🍪'), S('leche', 'Leche', '🥛'),
      S('pan', 'Pan', '🍞'), S('arroz', 'Arroz', '🍚'), S('pollo', 'Pollo', '🍗'), S('jugo', 'Jugo', '🧃'), S('sopa', 'Sopa', '🍲'),
      S('fruta', 'Fruta', '🍇'), S('helado', 'Helado', '🍦'), S('huevo', 'Huevo', '🥚') ] },
    { id: 'juego', label: 'Juego', emoji: '⚽', color: '#d9c8f0', items: [
      S('pelota', 'Pelota', '⚽'), S('tablet', 'Tablet', '📱'), S('libro', 'Libro', '📚'), S('musica', 'Música', '🎵'),
      S('muneco', 'Muñeco', '🧸'), S('bloques', 'Bloques', '🧱'), S('video', 'Video', '📺'), S('columpio', 'Columpio', '🎠') ] },
    { id: 'preguntas', label: 'Preguntas', emoji: '❓', color: '#bfe3c9', items: [
      S('hola', 'Hola', '👋'), S('adios', 'Adiós', '🙋'), S('que', '¿Qué?', '❓'), S('quien', '¿Quién?', '🧐'),
      S('donde', '¿Dónde?', '📍'), S('cuando', '¿Cuándo?', '🕒'), S('porque', '¿Por qué?', '🤔'), S('puedo', '¿Puedo?', '🙏') ] }
  ];
  // Botones de emergencia siempre visibles: se dicen al instante
  EM.QUICK = ['ayuda', 'bano', 'duele', 'si', 'no'];
})();
