export const getFirebaseErrorMessage = (error: any): string => {
  const errorCode = error.code;
  const errorMessage = error.message;

  if (!errorCode) {
    return errorMessage || 'Ha ocurrido un error inesperado';
  }

  switch (errorCode) {
    case 'auth/invalid-email':
      return 'El formato del correo electrónico no es válido';
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido deshabilitada';
    case 'auth/user-not-found':
      return 'No existe una cuenta con este correo';
    case 'auth/wrong-password':
      return 'La contraseña es incorrecta';
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con este correo';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres';
    case 'auth/network-request-failed':
      return 'Error de conexión. Verifica tu internet';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Inténtalo más tarde';
    case 'auth/popup-closed-by-user':
      return 'Inicio de sesión cancelado';
    case 'firestore/permission-denied':
      return 'No tienes permisos para realizar esta acción';
    case 'firestore/not-found':
      return 'El documento solicitado no existe';
    case 'firestore/already-exists':
      return 'El documento ya existe';
    case 'firestore/unavailable':
      return 'Servicio no disponible. Verifica tu conexión';
    case 'firestore/aborted':
      return 'La operación fue cancelada';
    case 'firestore/out-of-range':
      return 'Fuera de rango';
    case 'firestore/unauthenticated':
      return 'No estás autenticado';
    default:
      return errorMessage || 'Ha ocurrido un error inesperado';
  }
};

export const handleFirebaseError = (error: any, showAlert: (message: string) => void) => {
  const friendlyMessage = getFirebaseErrorMessage(error);
  showAlert(friendlyMessage);
  console.error('Firebase Error:', error);
};
