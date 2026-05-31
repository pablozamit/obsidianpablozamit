# 🚀 GUÍA RÁPIDA PARA TESTEAR LA APP

## Método 1: En la Web (MÁS SENCILLO)

1. **Abre una terminal** en la carpeta `suplementacion-app`

2. **Ejecuta**:
   ```bash
   npm run web
   ```

3. **Abre tu navegador** en el enlace que aparece (normalmente `http://localhost:19006`)

4. **¡Listo!** Verás la app funcionando en tiempo real

---

## Método 2: Con Expo Go (En tu celular)

1. **Instala** la app [Expo Go](https://expo.dev/go) en tu celular

2. **En terminal, ejecuta**:
   ```bash
   npm start
   ```

3. **Escanea** el código QR con Expo Go

4. **¡Listo!** La app cargará en tu celular

---

## Método 3: Automático (Doble click)

1. **Doble click** en `iniciar-app.bat`
2. **Espera** a que termine de instalar
3. **Abre** el enlace de web o escanea el QR

---

## ⚠️ Primero: Instalar Dependencias

Las dependencias no están instaladas. Ejecuta:

```bash
npm install --legacy-peer-deps
```

Esto puede tardar 5-10 minutos.

---

## ❓ Problemas Comunes

**Error "expo no reconocido"**: `npm install` primero

**Error de red**: Intenta `npm install --legacy-peer-deps --registry=https://registry.npmjs.org`

**Si todo falla**: Borra `node_modules` y `package-lock.json`, luego reinstala

---

## 📱 Firebase YA configurado ✅

Las credenciales de Firebase ya están en `.env`, no necesitas hacer nada más.
