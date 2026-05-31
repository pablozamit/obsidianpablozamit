# 🧪 Tests de Suplementación App

Este directorio contiene los tests unitarios y de integración de la aplicación.

## 📦 Estructura

```
__tests__/
├── store/                    # Tests de Zustand stores
│   ├── authStore.test.ts    # Authentication store
│   └── streakStore.test.ts  # Gamification store
├── utils/                    # Tests de utilidades
│   ├── errorHandler.test.ts # Manejo de errores
│   └── validation.test.ts   # Validación con Zod
└── screens/                  # Tests de componentes UI
    ├── LoginScreen.test.tsx
    └── RegisterScreen.test.tsx
```

## 🏃 Ejecutar Tests

```bash
# Todos los tests
npm test

# Watch mode (desarrollo)
npm run test:watch

# Con cobertura
npm run test:coverage
```

## 📊 Coverage

Objetivos mínimos:
- Branches: 30%
- Functions: 40%
- Lines: 45%
- Statements: 45%

## 📝 Convenciones

### Nombres de Archivos
- Usar `.test.ts` para TypeScript tests
- Usar `.test.tsx` para React component tests
- Colocar tests en carpeta `__tests__/` junto al código que testean

### Estructura de Test

```typescript
describe('Componente/Modulo', () => {
  beforeEach(() => {
    // Setup antes de cada test
  });

  afterEach(() => {
    // Cleanup después de cada test
  });

  it('should do something correctly', () => {
    // Arrange (preparación)
    // Act (ejecución)
    // Assert (verificación)
  });
});
```

## 🔧 Mocks

Los mocks definidos incluyen:

- `expo-font`: Mock para carga de fuentes
- `expo-asset`: Mock para carga de assets
- `firebase`: Mock de Firebase services
- `react-native/Alert`: Mock para alertas
- `react-native-vector-icons/Ionicons`: Mock para iconos

## 📚 Para Aprender Más

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Principles](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
