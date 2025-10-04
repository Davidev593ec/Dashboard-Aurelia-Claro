# Integración con Google Forms/Sheets

Este documento explica cómo conectar Google Forms con el dashboard en tiempo real.

## Opción 1: Google Apps Script (Recomendado)

### Paso 1: Crear Google Form

Crea un formulario con los siguientes campos:
- Fecha (Date)
- Letra (Short answer) - Ej: M, E, V, RR, H
- Número (Number)
- Módulo (Number)
- Tiempo (Number - opcional)
- Observación (Paragraph - opcional)

### Paso 2: Agregar Script al Form

1. En tu Google Form, click en los 3 puntos → "Script editor"
2. Pega el siguiente código:

```javascript
function onFormSubmit(e) {
  var formResponse = e.response;
  var itemResponses = formResponse.getItemResponses();

  var data = {
    fecha: formatDate(itemResponses[0].getResponse()),
    letra: itemResponses[1].getResponse(),
    numero: parseInt(itemResponses[2].getResponse()),
    modulo: parseInt(itemResponses[3].getResponse()),
    tiempo: itemResponses[4] ? parseInt(itemResponses[4].getResponse()) : null,
    observacion: itemResponses[5] ? itemResponses[5].getResponse() : null
  };

  // Reemplaza con la URL de tu servidor
  var url = 'https://tu-dominio.com/api/sync/google-sheets';

  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(data)
  };

  try {
    UrlFetchApp.fetch(url, options);
  } catch (error) {
    Logger.log('Error al enviar datos: ' + error);
  }
}

function formatDate(dateString) {
  var date = new Date(dateString);
  var day = ('0' + date.getDate()).slice(-2);
  var month = ('0' + (date.getMonth() + 1)).slice(-2);
  var year = date.getFullYear();
  return day + '/' + month + '/' + year;
}

function setupTrigger() {
  ScriptApp.newTrigger('onFormSubmit')
    .forForm(FormApp.getActiveForm())
    .onFormSubmit()
    .create();
}
```

3. Ejecuta la función `setupTrigger()` una vez para activar el trigger

### Paso 3: Desplegar el Dashboard

Si estás en desarrollo local, necesitas exponer tu servidor con:
- ngrok: `ngrok http 3000`
- localtunnel: `npx localtunnel --port 3000`

Actualiza la URL en el script con tu dominio público.

## Opción 2: Zapier (Sin código)

1. Crea una cuenta en [Zapier](https://zapier.com)
2. Crea un nuevo Zap:
   - **Trigger**: Google Forms - New Response
   - **Action**: Webhooks by Zapier - POST
3. Configura el POST:
   - URL: `https://tu-dominio.com/api/sync/google-sheets`
   - Payload Type: JSON
   - Data: mapea los campos del form a los campos requeridos

## Opción 3: Make.com (Integromat)

Similar a Zapier pero con más opciones gratis:
1. Crea un escenario en [Make.com](https://make.com)
2. Módulo 1: Google Forms - Watch Responses
3. Módulo 2: HTTP - Make a Request
   - URL: `https://tu-dominio.com/api/sync/google-sheets`
   - Method: POST
   - Body: JSON con los campos mapeados

## Opción 4: Google Sheets con Polling

Si prefieres usar Google Sheets directamente:

1. Crea un endpoint que lea desde Google Sheets API
2. Configura un cron job que ejecute cada X minutos
3. Sincroniza solo registros nuevos

## Formato del POST Request

```json
{
  "fecha": "03/10/25",
  "letra": "M",
  "numero": 150,
  "modulo": 7,
  "tiempo": 25,
  "observacion": "Cliente satisfecho"
}
```

## Testing Local

Puedes probar el endpoint con curl:

```bash
curl -X POST http://localhost:3000/api/sync/google-sheets \
  -H "Content-Type: application/json" \
  -d '{
    "fecha": "03/10/25",
    "letra": "M",
    "numero": 999,
    "modulo": 1,
    "tiempo": 15,
    "observacion": "Test"
  }'
```

## Seguridad

Para producción, considera agregar:
- API Key para autenticar las peticiones desde Google
- Rate limiting
- Validación adicional de datos
- Logs de auditoría

Ejemplo de middleware de seguridad:

```typescript
// server/middleware/api-key.ts
export default defineEventHandler((event) => {
  if (event.path.startsWith('/api/sync/')) {
    const apiKey = getHeader(event, 'x-api-key')

    if (apiKey !== process.env.SYNC_API_KEY) {
      throw createError({
        statusCode: 401,
        message: 'API Key inválida'
      })
    }
  }
})
```

Agrega a `.env`:
```
SYNC_API_KEY=tu-api-key-secreta
```
