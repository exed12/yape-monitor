// v6 - con reportes y codigo de seguridad
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
  let nombre = null, monto = null, codigo = null;

  const p1 = /^(.+?)\s+te\s+envi[oó]\s+un\s+pago\s+por\s+S\/\s*([\d,.]+)/i;
  const p2 = /Yape!\s+(.+?)\s+te\s+envi[oó]\s+un\s+pago\s+por\s+S\/\s*([\d,.]+)/i;
  const p3 = /S\/\s*([\d,.]+)/i;
  const p4 = /^(.+?)\s+te\s+envi/i;
  const pCod = /c[oó]d(?:\.|igo)?\s+de\s+seguridad\s+es:\s*(\d+)/i;

  for (const texto of [textoCompleto, titulo]) {
    if (!texto || texto.includes('[')) continue;
    const mc = texto.match(pCod);
    if (mc && !codigo) codigo = mc[1];
    const m2 = texto.match(p2);
    if (m2) { nombre = nombre || m2[1].trim(); monto = monto || parseFloat(m2[2].replace(',','.')); continue; }
    const m1 = texto.match(p1);
    if (m1) { nombre = nombre || m1[1].trim(); monto = monto || parseFloat(m1[2].replace(',','.')); continue; }
    const m3 = texto.match(p3);
    if (m3 && !monto) monto = parseFloat(m3[1].replace(',','.'));
    const m4 = texto.match(p4);
    if (m4 && !nombre) nombre = m4[1].trim();
  }

  return { nombre: nombre || 'Pago recibido', monto: monto || 0, codigo: codigo || null, textoOriginal: textoCompleto };
}

app.post('/yape', (req, res) => {
  console.log('[YAPE] Body:', JSON.stringify(req.body));
  const { nombre, monto, codigo, textoOriginal } = extraerDatos(req.body);
  const ahora = new Date();
  const pago = {
    id: Date.now(), nombre, monto, codigo, textoOriginal,
    hora: horaAhoraPeru(),
    fecha: fechaHoyPeru(),
    ts: ahora.toISOString()
  };
  pagos.unshift(pago);
  if (pagos.length > 2000) pagos.pop();
  console.log('[YAPE] Procesado:', pago);
  res.json({ ok: true, pago });
});

app.get('/pagos', (req, res) => {
  const hoy = fechaHoyPeru();
  res.json(pagos.filter(p => p.fecha === hoy));
});

app.get('/pagos/todos', (req, res) => res.json(pagos));

app.get('/reporte', (req, res) => {
  const { periodo, fecha } = req.query;
  const ahora = new Date();
  let filtrados = pagos;

  if (periodo === 'dia') {
    const dia = fecha || fechaHoyPeru();
    filtrados = pagos.filter(p => p.fecha === dia);
  } else if (periodo === 'semana') {
    const hace7 = new Date(ahora); hace7.setDate(hace7.getDate() - 6);
    filtrados = pagos.filter(p => p.ts && new Date(p.ts) >= hace7);
  } else if (periodo === 'mes') {
    const mes = fecha ? fecha.slice(0,7) : ahora.toISOString().slice(0,7);
    filtrados = pagos.filter(p => p.ts && p.ts.slice(0,7) === mes);
  } else if (periodo === 'anio') {
    const anio = fecha ? fecha.slice(0,4) : String(ahora.getFullYear());
    filtrados = pagos.filter(p => p.ts && p.ts.slice(0,4) === anio);
  }

  const total = filtrados.reduce((s,p) => s + (p.monto||0), 0);
  const porDia = {};
  filtrados.forEach(p => { porDia[p.fecha] = (porDia[p.fecha]||0) + (p.monto||0); });

  res.json({ pagos: filtrados, total: parseFloat(total.toFixed(2)), cantidad: filtrados.length, porDia });
});

app.get('/ping', (req, res) => res.send('ok'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor Yape activo en puerto ${PORT}`));
