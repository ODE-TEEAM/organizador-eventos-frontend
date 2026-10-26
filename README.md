# HEstia · Organizador de Eventos (Frontend)

Aplicación web para organizadores de eventos independientes. Permite crear eventos, armar su plan logístico (gestiones con plazo y horas), ver cada día lo urgente y medir cuánto falta para tener todo listo, sin pasar del límite de horas diarias que define cada organizador.

Hecha con **React 19 + Vite** y desplegada en **Vercel**. Consume la API REST del [backend en Django](https://github.com/ODE-TEEAM/organizador-eventos-backend).

## Enlaces

| Recurso | URL |
| --- | --- |
| Aplicación (producción) | https://organizador-eventos-frontend.vercel.app |
| API base | https://organizador-eventos-backend-05nj.onrender.com/api/ |
| Estado de la API | https://organizador-eventos-backend-05nj.onrender.com/api/health/ |
| Documentación de la API (Swagger) | https://organizador-eventos-backend-05nj.onrender.com/api/docs/ |
| Repositorio del backend | https://github.com/ODE-TEEAM/organizador-eventos-backend |

> La API está en el plan gratuito de Render: si lleva un rato sin uso, la primera petición puede tardar hasta un minuto mientras el servidor despierta.

## Cuenta demo

- **Correo:** prueba1@gmail.com
- **Contraseña:** 123456

También puedes crear tu propia cuenta desde **Registrarse**.

## Cómo probar la aplicación (tareas T1 a T4)

1. Abre la [aplicación](https://organizador-eventos-frontend.vercel.app) e inicia sesión con la cuenta demo.
2. **T1 · Crear evento y su plan logístico:** ve a **Crear evento**, llena los datos del evento y agrega una o varias gestiones (nombre, plazo y horas). Pulsa **Crear evento**: te lleva a la página del evento.
3. **T2 · Ver lo urgente de hoy:** en **Hoy** las gestiones salen agrupadas en *vencidas*, *para hoy* y *próximas*, de la más urgente a la más lejana.
4. **T3 · Reprogramar y evitar la sobrecarga:** en **Hoy** usa **Reprogramar** o **Posponer** (en la página del evento también puedes **Editar** el plazo). Si una fecha supera tu límite diario, la app lo avisa y sugiere días con espacio. El límite se cambia desde **Mi perfil → Límite diario** (de 1 a 16 h).
5. **T4 · Marcar como hecha y ver el avance:** pulsa **Hecha** en una gestión y revisa **Progreso** (y la barra del encabezado) para ver cuánto llevas.

## Pantallas

| Ruta | Para qué sirve |
| --- | --- |
| `/login`, `/registro` | Iniciar sesión o crear cuenta |
| `/hoy` | Gestiones urgentes del día: vencidas, para hoy y próximas; acciones Hecha, Posponer y Reprogramar |
| `/crear` | Crear un evento y su plan logístico; muestra el límite diario y avisa de conflictos de horas antes de guardar |
| `/eventos` | Lista de todos tus eventos |
| `/evento/:id` | Detalle del evento: editarlo, agregar varias gestiones a la vez, marcar, posponer, reactivar y eliminar |
| `/progreso` | Avance de cada evento con semáforo (completo, en curso, atrasado) y siguiente gestión pendiente |

En el encabezado de todas las pantallas se ven siempre las **horas libres de hoy** frente a tu límite y el **avance total** de tus gestiones.

## Accesibilidad

- Todo se puede usar con teclado; el primer `Tab` muestra **Saltar al contenido principal**.
- Foco visible en todos los controles y foco atrapado dentro de los modales.
- Mensajes de error asociados a cada campo y avisos para lectores de pantalla.
- Contraste de textos según WCAG AA.

## Ejecutar en local

Requisitos: **Node.js 20.19 o superior (o 22.12+)** y npm.

```bash
git clone https://github.com/ODE-TEEAM/organizador-eventos-frontend.git
cd organizador-eventos-frontend
npm install
cp .env.example .env
npm run dev
```

La app queda en `http://localhost:5173`. Por defecto apunta a una API local en `http://localhost:8000/api`; para usar la API publicada, cambia `VITE_API_URL` en el archivo `.env`.

### Variables de entorno

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `VITE_API_URL` | URL base de la API (termina en `/api`) | `https://organizador-eventos-backend-05nj.onrender.com/api` |
| `VITE_APP_NAME` | Nombre de la aplicación | `Organizador de Eventos` |

### Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Compila la versión de producción en `dist/` |
| `npm run preview` | Sirve localmente la versión compilada |
| `npm run lint` | Revisa el código con Oxlint |

## Estructura

```text
src/
├── App.jsx              # Rutas de la aplicación
├── auth.js              # Sesión y token (localStorage) y cabeceras de la API
├── components/          # Header, ResumenDia, ModalPerfil, FocoDialogos, ProtectedRoute...
├── pages/               # Hoy, Crear, Eventos, Evento, Progreso, Login, Registro
├── utils/               # validacion.js (reglas y mensajes) y semaforo.js (estados por color)
└── index.css            # Sistema de diseño y estilos globales
```

## Despliegue

Vercel despliega automáticamente cada cambio que llega a `main`. El archivo `vercel.json` redirige todas las rutas a `index.html` para que funcionen las rutas de la SPA (por ejemplo, recargar en `/evento/12`). En Vercel debe estar configurada la variable `VITE_API_URL` con la URL de la API publicada.

## Equipo

Proyecto integrador · Equipo 5 (ODE-TEEAM).
