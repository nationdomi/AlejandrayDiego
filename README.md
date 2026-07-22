# Alejandra & Diego — Sitio de Boda

Sitio 100% estático (HTML + CSS + JS puro). Sin frameworks, sin build, listo para GitHub Pages.

## Estructura

```
├── index.html      → Invitación principal
├── guia.html       → Guía de viaje (Manta)
├── gracias.html    → Página de agradecimiento tras confirmar asistencia
├── styles.css      → Estilos compartidos
├── script.js       → Animaciones de scroll + botones "Copiar"
└── assets/
    ├── fondo.jpg   → Acuarela de fondo (optimizada)
    ├── logo.png    → Monograma A&D
    └── nombre.png  → "Alejandra y Diego" en caligrafía
```

## ⚠️ Antes de publicar: configurar el formulario RSVP

El formulario usa **FormSubmit.co** (gratis, sin backend). En `index.html`, buscá:

```html
<form class="rsvp-form" action="https://formsubmit.co/TU_CORREO_AQUI" method="POST">
```

Reemplazá `TU_CORREO_AQUI` por el email real de los novios (ej: `alejandraydiego@gmail.com`).

La **primera vez** que alguien envíe el formulario, FormSubmit manda un mail de
activación a esa casilla — hay que hacer clic en el link una sola vez y listo.
Después, cada confirmación llega por email con nombre, correo, asistencia y mensaje.

## 📸 Slideshow de fotos de los invitados (Google Drive)

La sección "Recuerdos Compartidos" puede mostrar automáticamente un slideshow con las
fotos que los invitados suban a la carpeta de Drive. Requiere una API key gratuita
(5 minutos, una sola vez):

1. Entrá a https://console.cloud.google.com y creá un proyecto (ej: "boda-ad")
2. **APIs y servicios → Biblioteca** → buscá **Google Drive API** → **Habilitar**
3. **APIs y servicios → Credenciales → Crear credenciales → Clave de API**
4. Copiá la key y pegala en `script.js`, línea ~13:
   ```js
   const DRIVE_API_KEY = "AIzaSy..."; // ← acá
   ```
5. **Recomendado (seguridad):** editá la key → *Restricciones de aplicación* →
   *Sitios web* → agregá tu dominio (`alejandraydiego.com/*` y `*.github.io/*`).
   Y en *Restricciones de API* → limitala solo a **Google Drive API**.
   Así aunque la key sea visible en el código (inevitable en un sitio estático),
   solo sirve para listar esa carpeta pública desde tu dominio.

**Requisito:** la carpeta de Drive debe estar compartida como
"Cualquier persona con el enlace" (ya lo está, porque los invitados suben ahí).

Si la key queda vacía o falla, la sección muestra "Las fotos aparecerán pronto"
con el link a la carpeta — nunca se rompe.

El slideshow: auto-avanza cada 4,5 s, se pausa al pasar el mouse, tiene flechas,
puntos de navegación, swipe en el celular y respeta `prefers-reduced-motion`.
Muestra hasta 60 fotos, las más recientes primero.

## 📋 RSVP en Google Sheets (recomendado)

En vez de recibir emails sueltos, cada confirmación puede caer en una planilla
(fecha, nombre, correo, asistencia, mensaje). Configuración (10 min, una vez):

1. Creá una hoja en https://sheets.google.com (ej: "Confirmaciones Boda").
   En la fila 1 poné: `Fecha | Nombre | Correo | Asistencia | Mensaje`
2. **Extensiones → Apps Script** → borrá lo que haya y pegá:
   ```js
   function doPost(e) {
     var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
     hoja.appendRow([
       new Date(),
       e.parameter.nombre || "",
       e.parameter.correo || "",
       e.parameter.asistencia || "",
       e.parameter.mensaje || ""
     ]);
     return ContentService.createTextOutput("ok");
   }
   ```
3. **Implementar → Nueva implementación → Aplicación web**
   - Ejecutar como: **Yo**
   - Acceso: **Cualquier persona**
   - → Implementar → autorizar → copiá la **URL de la aplicación web**
4. Pegá esa URL en `script.js`:
   ```js
   const SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/.../exec";
   ```

Si la URL queda vacía, el formulario usa FormSubmit (el respaldo por email).

## 🖼️ Imagen para WhatsApp (Open Graph)

`assets/og.jpg` es la tarjeta que aparece cuando comparten el link por WhatsApp,
Instagram o iMessage. **Después de publicar**, editá en `index.html` las dos
etiquetas que apuntan a `assets/og.jpg` y poné la URL absoluta final, ej:
`https://alejandraydiego.com/assets/og.jpg` — WhatsApp exige URL completa,
con la ruta relativa no muestra la imagen.

## 📅 Calendario

- El botón **Google Calendar** abre el evento pre-cargado (17 Oct 2026, 16:30–23:30
  hora de Ecuador, con lugar y descripción).
- El botón **iPhone / Outlook** descarga `boda-alejandra-diego.ics`, que además
  incluye un recordatorio automático un día antes. Si quieren cambiar la hora de
  fin, editá `DTEND` en ese archivo (está en UTC: hora Ecuador + 5).

## Publicar en GitHub Pages

1. Creá un repo en GitHub (ej: `boda-alejandra-diego`)
2. Subí todos estos archivos a la raíz del repo
3. En el repo: **Settings → Pages → Source: Deploy from a branch → Branch: main / (root)** → Save
4. En un minuto el sitio queda en `https://TU-USUARIO.github.io/boda-alejandra-diego/`

## Conectar el dominio de Namecheap

### En GitHub
1. **Settings → Pages → Custom domain** → escribí tu dominio (ej: `alejandraydiego.com`) → Save
2. Esto crea un archivo `CNAME` en el repo automáticamente
3. Marcá **Enforce HTTPS** (aparece disponible unos minutos después de configurar el DNS)

### En Namecheap
1. **Domain List → Manage → Advanced DNS**
2. Borrá los registros que vienen por defecto (el CNAME de parkingpage y el URL Redirect)
3. Agregá estos registros:

| Type  | Host | Value                | TTL       |
|-------|------|----------------------|-----------|
| A     | @    | 185.199.108.153      | Automatic |
| A     | @    | 185.199.109.153      | Automatic |
| A     | @    | 185.199.110.153      | Automatic |
| A     | @    | 185.199.111.153      | Automatic |
| CNAME | www  | TU-USUARIO.github.io. | Automatic |

4. Esperá la propagación DNS (de minutos a un par de horas)

## Notas

- Los botones "Copiar" de los datos bancarios copian al portapapeles con feedback visual.
- Las animaciones de aparición respetan `prefers-reduced-motion`.
- Las fuentes se cargan de Google Fonts (Cormorant Garamond, Crimson Text, Great Vibes).
- La sección "Las fotos de los invitados aparecerán aquí pronto" enlaza a la carpeta
  de Google Drive (un sitio estático no puede listar fotos de Drive automáticamente;
  si más adelante quieren una galería real, se puede sumar con la API de Drive).
