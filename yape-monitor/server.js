const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

let pagos = [];

function fechaHoyPeru() {
  return new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
}

function horaAhoraPerу() {
  return new Date().toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' });
}

function extraerDatos(body) {
  const textoCompleto = body.texto || body.monto || body.nombre || '';
  const titulo = body.nombre || '';
  const textoNotif = body.monto || '';

  let nombre = null;
  let monto = null;

  const patron1 = /Yape!\s+(.+?)\s+te\s+envi[oó]\s+un\s+pago\s+por\s+S\/\s*([\d,.]+)/i;
  const patron2 = /S\/\s*([\d,.]+)/i;
  const patron3 = /Yape!\s+(.+?)\s+te\s+envi/i;

  for (const texto of [textoCompleto, textoNotif, titulo]) {
    if (!texto) continue;
    const m1 = texto.match(patron1);
    if (m1) { nombre = nombre || m1[1].trim(); monto = monto || parseFloat(m1[2].replace(',','.')); }
    const m2 = texto.match(patron2);
    if (m2 && !monto) monto = parseFloat(m2[1].replace(',','.'));
    const m3 = texto.match(patron3);
    if (m3 && !nombre) nombre = m3[1].trim();
  }

  if (!nombre && titulo && titulo !== '[NOTIFICATION_TITLE]' && !titulo.includes('[')) nombre = titulo;
  if (!monto && textoNotif && !textoNotif.includes('[')) {
    const n = parseFloat(String(textoNotif).replace(/[^0-9.]/g, ''));
    if (!isNaN(n) && n > 0) monto = n;
  }

  return { nombre: nombre || 'Confirmación de Pago', monto: monto || 0, textoOriginal: textoCompleto || textoNotif };
}

app.post('/yape', (req, res) => {
  console.log('[YAPE] Body recibido:', JSON.stringify(req.body));

  const { nombre, monto, textoOriginal } = extraerDatos(req.body);

  // Hora: usa siempre la hora real del servidor en zona Lima
  const hora = horaAhoraPerу();
  const fecha = fechaHoyPeru();

  const pago = { id: Date.now(), nombre, monto, textoOriginal, hora, fecha };
  pagos.unshift(pago);
  if (pagos.length > 500) pagos.pop();

  console.log('[YAPE] Pago procesado:', pago);
  res.json({ ok: true, pago });
});

// Devuelve solo pagos de hoy
app.get('/pagos', (req, res) => {
  const hoy = fechaHoyPeru();
  const pagosHoy = pagos.filter(p => p.fecha === hoy);
  res.json(pagosHoy);
});

// Devuelve todos los pagos (historial completo)
app.get('/pagos/todos', (req, res) => {
  res.json(pagos);
});

app.get('/ping', (req, res) => res.send('ok'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor Yape activo en puerto ${PORT}`));
