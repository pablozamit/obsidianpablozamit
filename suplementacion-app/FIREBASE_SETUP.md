# Script de ayuda para Firebase

## Opción A: Usar Firebase MCP (recomendado)

Si usas un agente de OpenCode con Firebase MCP:
```
firebase_create_project → crear proyecto
firebase_create_app → crear app web
firebase_get_sdk_config → obtener credenciales
firestore_init_guide → inicializar Firestore
auth_init_guide → inicializar Auth
```

## Opción B: Firebase Admin SDK (script Node.js)

```bash
# 1. Descargar service-account.json desde:
# Firebase Console → Project Settings → Service Accounts → Generate new private key

# 2. Instalar firebase-admin
npm install firebase-admin

# 3. Ejecutar script de configuración
node firebase-admin-setup.js
```

## Opción C: Configuración manual

```bash
# 1. Copiar plantilla .env
cp .env.example .env

# 2. Completar con credenciales desde Firebase Console
# Project Settings → Tu app web → firebaseConfig

# 3. Habilitar en Firebase Console:
# - Authentication → Email/Password
# - Firestore Database → Create database (test mode)
```

## Para ejecutar la app

```bash
cd suplementacion-app
npm start
```

## Resumen de archivos

| Archivo | Propósito |
|---------|-----------|
| `.env` | Credenciales para app móvil (Expo/React Native) |
| `service-account.json` | Credenciales para scripts de servidor (Admin SDK) |
| `firebase-setup.js` | Guía rápida de configuración |
| `firebase-admin-setup.js` | Script con Firebase Admin SDK |
