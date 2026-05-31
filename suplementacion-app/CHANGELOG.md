# 📄 CHANGELOG

Todos los cambios notables del proyecto.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- Tests unitarios para Zustand stores (authStore, streakStore)
- Tests de integración para screens principales (Login, Register)
- Tests de utilidades (errorHandler, validation)
- Sistema de validación con Zod
- Componentes modulares para gamificación (StreakStats, AchievementsList)
- Componente reutilizable SuplementoForm
- Archivo CONTRIBUTING.md con guías de contribución
- Documentación de testing

### Changed
- Refactorización de componentes (DailyCheckIn, StreakBadge)
- Unificación de estilos en styles/forms.ts
- Tipado estricto de props de navegación
- Manejo de errores mejorado con Toast

### Fixed
- Código duplicado en streakStore.ts
- Caracteres chinos corruptos en screens
- Botón duplicado en SuplementoDetalleScreen
- Inconsistencia de nombres en app.json

### Security
- Añadido `.env` a .gitignore para evitar exponer credenciales

## [1.0.0] - 2025-02-19

### Added
- Implementación inicial de la app
- Autenticación con Firebase Auth
- CRUD de suplementos con Firestore
- Sistema de gamificación con rachas y logros
- UI en modo oscuro
- Navegación con React Navigation
- Persistencia con Zustand
- Toast notifications

### Tech Stack
- React Native 0.76 + Expo 51
- TypeScript 5.3+
- Firebase (Auth, Firestore)
- Zustand 4.5+
- Zod 3.23+
- React Navigation 6
