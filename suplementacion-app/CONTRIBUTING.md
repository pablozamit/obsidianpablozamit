# Contributing to Suplementación App

¡Gracias por tu interés en contribuir a la Suplementación App! Este documento proporciona una guía para contribuir.

## 📋 Requisitos Previos

- Node.js 18+
- npm o yarn
- Expo CLI: `npm install -g expo-cli`
- Cuenta de Firebase (para testing)

## 🚀 Configuración del Entorno

```bash
# Clonar el repositorio
git clone <repo-url>
cd suplementacion-app

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Firebase
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Watch mode (para desarrollo)
npm run test:watch

# Con coverage
npm run test:coverage
```

## 📁 Estructura del Proyecto

```
suplementacion-app/
├── src/
│   ├── components/        # Componentes reutilizables
│   ├── config/            # Configuración Firebase
│   ├── constants/         # Constantes (colores, etc)
│   ├── navigation/        # Navegación React Navigation
│   ├── screens/           # Pantallas de la app
│   ├── store/             # Zustand stores
│   ├── styles/            # Estilos compartidos
│   ├── types/             # Tipos TypeScript
│   ├── utils/             # Utilidades y helpers
│   └── __tests__/         # Tests
├── assets/                # Imágenes, iconos, fuentes
├── __tests__/             # Tests adicionales
├── app.json
├── package.json
├── tsconfig.json
└── jest.config.json
```

## 🔧 Cómo Contribuir

### 1. Crear una Nueva Rama

```bash
git checkout -b feature/nombre-de-la-funcion
# o
git checkout -b fix/correcion-bug
```

### 2. Realizar Cambios

- Sigue las convenciones de código existentes
- Usa TypeScript estricto
- Añade tests para nuevas funcionalidades
- Actualiza documentación si es necesario

### 3. Testing

```bash
# Ejecutar tests antes de commitear
npm test
```

Asegúrate de que todos los tests pasen.

### 4. Commit

Usa mensajes de commit convencionales:

- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `docs:` cambios en documentación
- `style:` formateo de código (sin cambios lógicos)
- `refactor:` refactorización
- `test:` añadir o actualizar tests
- `chore:` tareas de mantenimiento

Ejemplo:
```bash
git commit -m "feat: añadir sistema de notificaciones push"
```

### 5. Push y Pull Request

```bash
git push origin feature/nombre-de-la-funcion
```

Luego crea un Pull Request en GitHub.

## 📝 Estándares de Código

### TypeScript

- Siempre usa tipos estrictos (`strict: true`)
- Evita `any` cuando sea posible
- Define interfaces para objetos complejos

### Componentes

```
NombreDeComponente.tsx
NombreDeComponento.test.tsx
```

### Estilos

- Usa estilos compartidos cuando sea posible (`src/styles/`)
- Define constantes de colores en `src/constants/colors.ts`
- Evita estilos inline en JSX

### Estado

- Usa Zustand para estado global
- Prefiere `useState` local para estado simple
- Props tipadas usando `NativeStackScreenProps`

## 🎯 Prioridades de Desarrollo

### Alta Prioridad
- Correcciones de bugs críticos
- Actualizaciones de seguridad
- Features principales bloqueadas

### Media Prioridad
- Nuevas features
- Refactorización
- Mejoras de UX

### Baja Prioridad
- Mejoras de documentación
- Tests adicionales
- Optimización de performance

## 🐛 Reportando Issues

Cuando reportes un issue, incluye:

1. **Descripción clara** del problema
2. **Pasos para reproducir**
3. **Comportamiento esperado** vs actual
4. **Screenshots** si aplica
5. **Entorno**:
   - Versión de la app
   - Versión de React Native
   - Versión de Expo
   - Plataforma (iOS/Android/Web)
   - Versión del sistema operativo

## 💡 Sugerencias de Features

Al sugerir una nueva feature:

1. Describe claramente el problema que resuelve
2. Explica por qué es útil
3. Considera alternativas ya existentes
4. Si es posible, incluye ejemplos visuales

## 📚 Documentación

- Mantén el README actualizado
- Documenta componentes complejos con JSDoc
- Añade comentarios para lógica no obvia
- Actualiza CHANGELOG.md para cambios importantes

## 🤝 Código de Conducta

Sé respetuoso y constructivo:
- Respeta la privacidad de otros usuarios
- Sé claro y directo en la comunicación
- Acepta y da retroalimentación de forma constructiva
- No seas discriminatorio de ninguna forma

## 📜 Licencia

Al contribuir, acuerdas que tus contribuciones serán licenciadas bajo la Licencia MIT del proyecto.

## 🆘 Obteniendo Ayuda

Si necesitas ayuda:
- Lee la documentación existente
- Revisa issues abiertos
- Crea un nuevo issue con tu pregunta
- Contacta al equipo del proyecto

---

¡Gracias por contribuir! Tu ayuda es muy apreciada. 🙏
