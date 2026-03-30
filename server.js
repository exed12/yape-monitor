# Monitor Yape 🟣

Dashboard en tiempo real para notificaciones de pagos Yape.
Funciona 24/7 en la nube — sin necesidad de PC encendida.

## Archivos

```
yape-monitor/
├── server.js          ← Servidor Node.js
├── package.json       ← Dependencias
├── README.md          ← Este archivo
└── public/
    └── index.html     ← Dashboard web
```

## Despliegue en Railway (gratis)

1. Ve a https://railway.app y crea una cuenta (con Google o GitHub)
2. Clic en "New Project" → "Deploy from GitHub repo"
3. Sube esta carpeta a un repositorio de GitHub
4. Railway detecta Node.js automáticamente y despliega
5. En "Settings" → "Domains" → genera tu URL pública
   Ejemplo: https://yape-monitor-production.up.railway.app

## Configurar Macrodroid en el celular

1. Instala Macrodroid desde Play Store (gratis)
2. Crea una nueva macro:
   - TRIGGER: "Notificación recibida" → selecciona app "Yape"
   - ACCIÓN: "HTTP Request"
     - Método: POST
     - URL: https://TU-URL.railway.app/yape
     - Cabecera: Content-Type: application/json
     - Cuerpo (JSON):
       {
         "nombre": "[NOTIFICATION_TITLE]",
         "monto": "[NOTIFICATION_TEXT]",
         "hora": "[TIME]"
       }
3. Guarda y activa la macro

## Ver el dashboard

Abre desde cualquier celular o PC:
https://TU-URL.railway.app

Se actualiza automáticamente cada 5 segundos.

## Endpoint

POST https://TU-URL.railway.app/yape
Body JSON: { "nombre": "...", "monto": "...", "hora": "..." }

GET https://TU-URL.railway.app/pagos
Devuelve lista de últimos 200 pagos en JSON
