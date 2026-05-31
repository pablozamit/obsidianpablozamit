const fs = require('fs');
const path = require('path');

console.log('🔧 Configuración de Firebase para Suplementación App\n');

console.log('PASO 1: Obtener credenciales de Firebase Console');
console.log('================================================');
console.log('1. Ve a: https://console.firebase.google.com/');
console.log('2. Crea un nuevo proyecto o selecciona uno existente');
console.log('3. Click en el icono de engranaje ⚙️ (Project Settings)');
console.log('4. En "Your apps", click en el ícono web </> (Web app)');
console.log('5. Registra la app con nombre "Suplementacion App"');
console.log('6. Copy el objeto "firebaseConfig" generado\n');

console.log('PASO 2: Generar archivo .env');
console.log('=============================');

const envContent = `# Credenciales de Firebase (Expo/React Native)
# Completa estos valores desde Firebase Console → Project Settings → Tu App Web

EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=tu_app_id
`;

fs.writeFileSync(path.join(__dirname, '.env'), envContent);
console.log('✅ Archivo .env creado (complétalo con tus credenciales)\n');

console.log('PASO 3: Habilitar servicios en Firebase Console');
console.log('================================================');
console.log('1. Authentication → Sign-in method → Email/Password (habilitar)');
console.log('2. Firestore Database → Create database → Start in test mode\n');

console.log('PASO 4: Ejecutar la app');
console.log('=======================');
console.log('cd suplementacion-app');
console.log('npm start\n');

console.log('================================================');
console.log('NOTA: Para usar Firebase Admin SDK (scripts de servidor),');
console.log('descarga el archivo JSON de service account desde:');
console.log('Firebase Console → Project Settings → Service Accounts → Generate new private key');
console.log('================================================\n');
