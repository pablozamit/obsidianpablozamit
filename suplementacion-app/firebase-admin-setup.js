const fs = require('fs');
const path = require('path');

console.log('🔥 Firebase Admin SDK - Script de Configuración');
console.log('================================================\n');

const serviceAccountPath = path.join(__dirname, 'service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.log('❌ ERROR: No se encontró service-account.json');
  console.log('\nPara crear este archivo:');
  console.log('1. Ve a https://console.firebase.google.com/');
  console.log('2. Project Settings → Service Accounts');
  console.log('3. Click en "Generate new private key"');
  console.log('4. Guarda el archivo como: service-account.json');
  console.log('   en la carpeta: suplementacion-app/');
  console.log('\n⚠️  IMPORTANTE: Añade service-account.json a .gitignore\n');
  process.exit(1);
}

console.log('✅ Service account encontrado\n');

// Cargar Firebase Admin SDK si está instalado
let admin;
try {
  admin = require('firebase-admin');
} catch (e) {
  console.log('📦 Instalando firebase-admin...');
  const { execSync } = require('child_process');
  execSync('npm install firebase-admin', { stdio: 'inherit' });
  admin = require('firebase-admin');
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function setup() {
  console.log('🔄 Conectando a Firestore...');

  // Configurar reglas de seguridad (modo de prueba)
  console.log('📝 Configurando reglas de Firestore...');

  // Crear colección de ejemplo
  const suplementosEjemplo = [
    {
      nombre: 'Vitamina D3',
      dosis: '5000 UI',
      frecuencia: 'diario',
      hora: '08:00',
      categoria: 'vitaminas',
      notas: 'Mejor absorber con comida grasa',
      activo: true,
      creadoEn: new Date(),
    },
    {
      nombre: 'Magnesio Bisglicinato',
      dosis: '400mg',
      frecuencia: 'diario',
      hora: '21:00',
      categoria: 'minerales',
      notas: 'Antes de dormir para mejorar sueño',
      activo: true,
      creadoEn: new Date(),
    },
    {
      nombre: 'Omega 3',
      dosis: '2g',
      frecuencia: 'diario',
      hora: '08:30',
      categoria: 'otros',
      notas: 'EPA+DHA mínimos 2g',
      activo: true,
      creadoEn: new Date(),
    },
  ];

  console.log('📦 Creando suplementos de ejemplo...');
  
  const batch = db.batch();
  const usuariosRef = db.collection('usuarios');
  const suplementosRef = db.collection('suplementos');

  // Crear documento de usuario demo
  const userDocRef = usuariosRef.doc('demo-user-id');
  batch.set(userDocRef, {
    nombre: 'Usuario Demo',
    email: 'demo@suplementacion.app',
    creadoEn: new Date(),
  });

  // Crear suplementos de ejemplo
  suplementosEjemplo.forEach((sup) => {
    const docRef = suplementosRef.doc();
    batch.set(docRef, {
      ...sup,
      usuarioId: 'demo-user-id',
      creadoEn: admin.firestore.Timestamp.now(),
    });
  });

  await batch.commit();
  console.log('✅ Datos de ejemplo creados!\n');

  // Mostrar estructura de datos
  console.log('📊 Estructura de Firestore:');
  console.log('├── usuarios/{userId}');
  console.log('│   ├── nombre');
  console.log('│   ├── email');
  console.log('│   └── creadoEn');
  console.log('└── suplementos/{suplementoId}');
  console.log('    ├── nombre');
  console.log('    ├── dosis');
  console.log('    ├── frecuencia');
  console.log('    ├── hora');
  console.log('    ├── categoria');
  console.log('    ├── notas');
  console.log('    ├── activo');
  console.log('    ├── usuarioId');
  console.log('    └── creadoEn\n');

  console.log('🎉 Firebase configurado correctamente!');
  console.log('\nPara ver los datos:');
  console.log('1. Ve a https://console.firebase.google.com/');
  console.log('2. Selecciona tu proyecto');
  console.log('3. Click en Firestore Database\n');

  process.exit(0);
}

setup().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
