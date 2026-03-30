const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

let pagos = [];

// Recibe pago desde Macrodroid
app.post('/yape', (req, res) => {
  const { monto, nombre, hora } = req.body;

  // Extrae número del texto si viene como "te envió S/ 50.00"
  const montoNum = parseFloat(
    String(monto).replace(/[^0-9.]/g, '')
  ) || 0;

  const pago = {
    id: Date.now(),
    nombre: nombre || 'Desconocido',
    monto: montoNum,
    texto: monto,
    hora: hora || new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    fecha: new Date().toLocaleDateString('es-PE')
  };

  pagos.unshift(pago);
  if (pagos.length > 200) pagos.pop();

  console.log('[YAPE] Pago recibido:', pago);
  res.json({ ok: true, pago });
});

// Dashboard consulta pagos
app.get('/pagos', (req, res) => {
  res.json(pagos);
});

// Health check
app.get('/ping', (req, res) => res.send('ok'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Yape activo en puerto ${PORT}`);
});
