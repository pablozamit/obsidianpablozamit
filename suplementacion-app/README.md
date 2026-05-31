# App de Suplementación

App móvil para gestión de suplementos desarrollada con Expo + React Native + Firebase + TypeScript.

## ✨ Características

- 🔐 Autenticación con Firebase Auth (Email/Password)
- 👤 Sistema de usuarios con sesión persistente
- 💊 Gestión completa de suplementos (crear, editar, eliminar, activar/desactivar)
- 📊 Categorización: Vitaminas, Minerales, Proteínas, Aminoácidos, Otros
- 🎯 Sistema de gamificación con rachas diarias (streaks)
- 🏆 Logros desbloqueables por consistencia
- 🔔 Notificaciones Toast para feedback de usuario
- 🌙 UI en modo oscuro optimizada
- 💾 Sincronización en tiempo real con Firestore
- 📱 Multiplataforma (iOS, Android, Web)
- 🛡️ TypeScript con tipos estrictos

## 🛠️ Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| **Framework** | React Native 0.76 + Expo 51 |
| **Lenguaje** | TypeScript 5.3+ |
| **Estado Global** | Zustand 4.5+ |
| **Backend** | Firebase (Auth, Firestore) |
| **Navegación** | React Navigation 6 |
| **Validación** | Zod 3.23+ |
| **UI** | Custom components + vector-icons |

## 📦 Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd suplementacion-app

# Instalar dependencias
npm install
```

## ⚙️ Configuración Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita **Authentication** → Email/Password
3. Habilita **Firestore Database** (modo production con reglas)
4. Copia `.env.example` a `.env` y completa los valores:

```bash
cp .env.example .env
```

Variables requeridas en `.env`:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=Tu_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=Tu_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=Tu_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=Tu_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=Tu_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=Tu_app_id
```

## 🚀 Ejecutar

```bash
# Desarrollo con Expo
npm start

# iOS (solo macOS)
npm run ios

# Android
npm run android

# Web
npm run web
```

## 📁 Estructura del Proyecto

```
suplementacion-app/
├── src/
│   ├── components/        # Componentes reutilizables
│   │   ├── Toast.tsx              # Notificaciones animadas
│   │   ├── SuplementoForm.tsx     # Formulario compartido
│   │   ├── DailyCheckIn.tsx       # Check-in diario
│   │   ├── StreakBadge.tsx        # Badge de rachas
│   │   ├── StreakStats.tsx        # Estadísticas de racha
│   │   └── AchievementsList.tsx   # Lista de logros
│   ├── config/            # Configuración
│   │   └── firebase.ts            # Configuración Firebase
│   ├── constants/         # Constantes
│   │   └── colors.ts              # Paleta de colores
│   ├── navigation/        # Navegación
│   │   └── index.tsx              # Stack Navigator
│   ├── screens/           # Pantallas
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── AddSuplementoScreen.tsx
│   │   ├── EditSuplementoScreen.tsx
│   │   └── SuplementoDetalleScreen.tsx
│   ├── store/             # Estado global (Zustand)
│   │   ├── index.ts               # Auth store
│   │   └── streakStore.ts         # Gamification store
│   ├── styles/            # Estilos reutilizables
│   │   └── forms.ts               # Estilos de formularios
│   ├── types/             # Tipos TypeScript
│   │   └── index.ts               # Definiciones de tipos
│   └── utils/             # Utilidades
│       ├── errorHandler.ts        # Manejo de errores
│       └── validation.ts          # Esquemas Zod
├── app.json
├── package.json
├── tsconfig.json
└── README.md
```

## 🎨 Paleta de Colores

| Color | Código | Uso |
|-------|--------|-----|
| Primary | `#11b4d4` | Botones, acentos |
| Secondary | `#FFC52E` | Logros dorados |
| Background | `#111111` | Fondo principal |
| Surface | `#1E1E1E` | Cards, inputs |
| Text | `#FFFFFF` | Texto principal |
| Text Muted | `#BFC7CF` | Texto secundario |
| Success | `#4CAF50` | Estados positivos |
| Error | `#FF5252` | Estados negativos |

## 🔒 Seguridad

- Variables de entorno en `.env` (ignoradas por git)
- Validación de formularios con Zod
- Passwords almacenados en Firebase Auth
- Reglas de Firestore por usuario autenticado

## 📊 Modelo de Datos

### Suplemento
```typescript
interface Suplemento {
  id: string;
  nombre: string;
  dosis: string;
  frecuencia: 'diario' | 'semanal' | 'mensual';
  hora?: string;
  categoria: 'vitaminas' | 'minerales' | 'proteinas' | 'aminoacidos' | 'otros';
  notas?: string;
  activo: boolean;
  creadoEn: Date;
  usuarioId: string;
}
```

### Usuario
```typescript
interface Usuario {
  uid: string;
  email: string;
  nombre: string;
  creadoEn: Date;
}
```

## 🧪 Pruebas (Pendiente)

```bash
# Unit tests
npm test

# Coverage
npm run test:coverage
```

## 📝 Tareas Pendientes

- [x] Tests unitarios para stores Zustand
- [x] Tests de integración para screens principales
- [ ] ESLint + Prettier config
- [ ] Notificaciones push de recordatorios
- [ ] Sincronización offline con Firestore
- [ ] Firebase Analytics
- [ ] Screenshots y GIFs en README
- [x] Documentación de contribución (CONTRIBUTING.md)

## 🧪 Testing

El proyecto utiliza Jest + React Native Testing Library:

```bash
# Ejecutar tests
npm test

# Watch mode
npm run test:watch

# Cobertura de código
npm run test:coverage
```

### Directorio de Tests

```
src/
├── __tests__/
│   ├── store/
│   │   ├── authStore.test.ts
│   │   └── streakStore.test.ts
│   ├── utils/
│   │   ├── errorHandler.test.ts
│   │   └── validation.test.ts
│   └── screens/
│       ├── LoginScreen.test.tsx
│       └── RegisterScreen.test.tsx
```

## 🤝 Contribución

Para contribuir al proyecto, por favor revisa nuestra guía en [CONTRIBUTING.md](./CONTRIBUTING.md).

### Pasos Rápidos

1. Fork del proyecto
2. Crea una rama: `git checkout -b feature/tu-feature`
3. Commit cambios: `git commit -m 'feat: añadir feature'`
4. Push: `git push origin feature/tu-feature`
5. Abre un Pull Request

### Convenciones de Commit

- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `docs:` documentación
- `test:` tests
- `refactor:` refactorización

Este proyecto es parte de una bóveda de Obsidian y está excluido de la sincronización automática con GitHub.

## 📄 Licencia

MIT
