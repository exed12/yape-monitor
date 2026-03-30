const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

let pagos = [];

function fechaHoyPeru() {
  return new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
}

function horaAhoraPeru() {
  return new Date().toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' });
}

function extraerDatos(body) {
  const textoCompleto = body.texto || body.monto || body.nombre || '';
  const titulo = body.nombre || '';

  let nombre = null;
  let monto = null;

  // "Yostin Ros* te envió un pago por S/ 1"
  const p1 = /^(.+?)\s+te\s+envi[oó]\s+un\s+pago\s+por\s+S\/\s*([\d,.]+)/i;
  // "Yape! NOMBRE te envió un pago por S/ 1"
  const p2 = /Yape!\s+(.+?)\s+te\s+envi[oó]\s+un\s+pago\s+por\s+S\/\s*([\d,.]+)/i;
  // Solo monto
  const p3 = /S\/\s*([\d,.]+)/i;
  // Solo nombre (antes de "te envió")
  const p4 = /^(.+?)\s+te\s+envi/i;

  for (const texto of [textoCompleto, titulo]) {
    if (!texto || texto.includes('[')) continue;

    const m2 = texto.match(p2);
    if (m2) { nombre = nombre || m2[1].trim(); monto = monto || parseFloat(m2[2].replace(',','.')); continue; }

    const m1 = texto.match(p1);
    if (m1) { nombre = nombre || m1[1].trim(); monto = monto || parseFloat(m1[2].replace(',','.')); continue; }

    const m3 = texto.match(p3);
    if (m3 && !monto) monto = parseFloat(m3[1].replace(',','.'));

    const m4 = texto.match(p4);
    if (m4 && !nombre) nombre = m4[1].trim();
  }

  return {
    nombre: nombre || 'Pago recibido',
    monto: monto || 0,
    textoOriginal: textoCompleto
  };
}

app.post('/yape', (req, res) => {
  console.log('[YAPE] Body recibido:', JSON.stringify(req.body));
  const { nombre, monto, textoOriginal } = extraerDatos(req.body);
  const hora = horaAhoraPeru();
  const fecha = fechaHoyPeru();
  const pago = { id: Date.now(), nombre, monto, textoOriginal, hora, fecha };
  pagos.unshift(pago);
  if (pagos.length > 500) pagos.pop();
  console.log('[YAPE] Pago procesado:', pago);
  res.json({ ok: true, pago });
});

app.get('/pagos', (req, res) => {
  const hoy = fechaHoyPeru();
  res.json(pagos.filter(p => p.fecha === hoy));
});

app.get('/pagos/todos', (req, res) => res.json(pagos));
app.get('/ping', (req, res) => res.send('ok'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor Yape activo en puerto ${PORT}`));
