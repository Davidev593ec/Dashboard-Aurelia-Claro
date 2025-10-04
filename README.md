# Dashboard Aurelia - Sistema de Estadísticas Claro

Dashboard interactivo para visualizar y analizar estadísticas de turnos y encuestas de atención al cliente de Claro, construido con Nuxt 3, Vue 3, Stylus y Chart.js.

## 🚀 Características

- ✅ **Autenticación JWT** con bcrypt
- 📊 **Dashboards Duales**: Turnos y Encuestas
- 📈 **Visualizaciones interactivas** con Chart.js
- 🎨 **Diseño responsive** con brand Claro
- 🔄 **Sidebar navegable** entre secciones
- 💾 **Base de datos SQLite** con Prisma ORM
- 📥 **Exportación a Excel** (XLSX)
- 🌐 **SSR con Nuxt 3**
- 🔍 **Filtros dinámicos** por categoría

## 📋 Requisitos

- Node.js 18+
- npm o yarn

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma y crear base de datos
npx prisma generate
npx prisma db push

# Importar datos desde CSV
npx tsx scripts/importCSV.ts        # Para turnos
npx tsx scripts/importEncuestas.ts  # Para encuestas
```

## 🔑 Usuario por Defecto

- **Email**: `admin@claro.com`
- **Password**: `admin123`

## 🚦 Ejecutar en Desarrollo

```bash
# Desarrollo
npm run dev

# Prisma Studio (visualizar datos)
npx prisma studio
```

Abre [http://localhost:3000](http://localhost:3000)

## 📊 Estructura del Proyecto

```
dashboard-app/
├── app/
│   ├── assets/
│   │   ├── icons/               # Iconos PNG personalizados
│   │   └── images/              # Logo Claro, fondo login
│   ├── components/
│   │   ├── BarChart.vue         # Gráfica de barras
│   │   ├── LineChart.vue        # Gráfica de líneas
│   │   ├── PieChart.vue         # Gráfica circular
│   │   ├── Sidebar.vue          # Navegación lateral
│   │   └── StatCard.vue         # Tarjetas KPI
│   ├── composables/
│   │   └── useAuth.ts           # Autenticación
│   └── pages/
│       ├── index.vue            # Redirect
│       ├── login.vue            # Login
│       ├── turnos.vue           # Dashboard Turnos
│       └── encuestas.vue        # Dashboard Encuestas
├── server/
│   ├── api/
│   │   ├── auth/                # Login/Register
│   │   ├── turnos/              # CRUD y stats
│   │   └── encuestas/           # CRUD y stats
│   ├── middleware/              # Auth middleware
│   └── utils/                   # Prisma, Auth
├── prisma/
│   └── schema.prisma            # Modelos: User, Turno, Encuesta
└── scripts/
    ├── importCSV.ts             # Importar turnos
    └── importEncuestas.ts       # Importar encuestas
```

## 📈 Dashboard Turnos

### KPIs:
- Total de Turnos
- Tiempo Promedio
- Módulo Más Ocupado
- Turnos por Día (Promedio)

### Gráficas:
1. **Pie Chart**: Distribución por tipo (Móvil, Equipos, Retención, Ventas, Hogar)
2. **Bar Chart**: Turnos por módulo
3. **Line Chart**: Evolución temporal
4. **Tabla**: Últimos 5 turnos registrados

### Filtros:
- Todas las categorías
- Móvil (M)
- Equipos (E)
- Retención (RR)
- Ventas (V)
- Hogar (H)

## 📊 Dashboard Encuestas

### KPIs:
- Total de Encuestas
- Promedio NPS
- NPS Score
- Promotores (9-10)

### Gráficas:
1. **Bar Chart**: Experiencia con el Servicio
2. **Bar Chart**: Recomendación del Servicio
3. **Lista**: Top 5 Mejoras Sugeridas
4. **Bar Chart**: Rango de Edad
5. **Tabla**: Últimas 5 encuestas registradas

### NPS (Net Promoter Score):
- **Detractores (0-6)**: Clientes insatisfechos
- **Pasivos (7-8)**: Clientes satisfechos
- **Promotores (9-10)**: Clientes muy satisfechos

## 🎨 Diseño

- **Colores Claro**: Rojo principal (#e30613)
- **Iconos personalizados**: PNG con fondo rojo semitransparente (10%)
- **Logo**: Claro en login y sidebar
- **Responsive**: Adaptable a móviles y tablets
- **Fondo login**: Imagen SVG de marca Aurelia

## 🗄️ Base de Datos

### Modelos Prisma:

**User**
- id, email, name, password
- Autenticación con bcrypt

**Turno**
- id, fecha, letra, numero, modulo, tiempo, observacion
- 386 registros importados

**Encuesta**
- id, nps, calificacion, comentario, rangoEdad
- 45 registros importados

**Comandos útiles**:

```bash
npx prisma studio      # Interfaz visual de datos
npx prisma generate    # Regenerar cliente
npx prisma db push     # Aplicar cambios schema
```

## 📥 Exportación Excel

Ambos dashboards incluyen botón "Descargar Excel" que exporta:
- Turnos: Todos los campos
- Encuestas: NPS, Calificación, Comentarios, Edad

## 🎨 Tech Stack

- **Frontend**: Nuxt 3, Vue 3, TypeScript, Stylus
- **Charts**: Chart.js, vue-chartjs, chartjs-plugin-datalabels
- **Database**: Prisma ORM, SQLite
- **Auth**: bcrypt, JWT
- **Export**: XLSX

## 🚢 Deployment

```bash
npm run build
npm run preview
```

**Variables de entorno** (`.env`):

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="tu-secreto-jwt"
```

## 📝 API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register

### Turnos
- `GET /api/turnos` - Listar turnos (limit, offset, letra)
- `POST /api/turnos` - Crear turno
- `GET /api/turnos/stats` - Estadísticas completas

### Encuestas
- `GET /api/encuestas` - Listar encuestas (limit, offset)
- `POST /api/encuestas` - Crear encuesta
- `GET /api/encuestas/stats` - Estadísticas NPS y distribuciones

## 🔐 Autenticación

El sistema usa middleware de autenticación en rutas protegidas:
- `/turnos` - Requiere login
- `/encuestas` - Requiere login

Token JWT almacenado en localStorage.

## 📱 Navegación

**Sidebar** (collapsible):
- Estadísticas (header)
- Turnos (con icono ticket.png)
- Encuestas (con icono survey.png)

**Botón flotante**: Abre/cierra sidebar en móvil

## 🎯 Próximos Pasos

- [ ] Integración con Google Forms en tiempo real
- [ ] Dashboard de comparativas temporales
- [ ] Exportación PDF de reportes
- [ ] Notificaciones push
- [ ] Modo oscuro

---

Desarrollado con ❤️ para Claro Aurelia
