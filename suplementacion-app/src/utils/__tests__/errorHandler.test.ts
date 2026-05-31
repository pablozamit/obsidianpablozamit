import { getFirebaseErrorMessage, handleFirebaseError } from '../errorHandler';
import { Alert } from 'react-native';

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

jest.mock('../config/firebase', () => ({}));

describe('ErrorHandler', () => {
  describe('getFirebaseErrorMessage', () => {
    it('should return friendly message for invalid email', () => {
      const error = {
        code: 'auth/invalid-email',
        message: 'The email address is badly formatted.',
      };

      const message = getFirebaseErrorMessage(error);
      expect(message).toBe('El formato del correo electrónico no es válido');
    });

    it('should return friendly message for wrong password', () => {
      const error = {
        code: 'auth/wrong-password',
        message: 'The password is invalid.',
      };

      const message = getFirebaseErrorMessage(error);
      expect(message).toBe('La contraseña es incorrecta');
    });

    it('should return friendly message for user not found', () => {
      const error = {
        code: 'auth/user-not-found',
        message: 'No user record found.',
      };

      const message = getFirebaseErrorMessage(error);
      expect(message).toBe('No existe una cuenta con este correo');
    });

    it('should return friendly message for weak password', () => {
      const error = {
        code: 'auth/weak-password',
        message: 'Password should be at least 6 characters.',
      };

      const message = getFirebaseErrorMessage(error);
      expect(message).toBe('La contraseña debe tener al menos 6 caracteres');
    });

    it('should return friendly message for network error', () => {
      const error = {
        code: 'auth/network-request-failed',
        message: 'A network error occurred.',
      };

      const message = getFirebaseErrorMessage(error);
      expect(message).toBe('Error de conexión. Verifica tu internet');
    });

    it('should return friendly message for too many requests', () => {
      const error = {
        code: 'auth/too-many-requests',
        message: 'Too many requests.',
      };

      const message = getFirebaseErrorMessage(error);
      expect(message).toBe('Demasiados intentos. Inténtalo más tarde');
    });

    it('should return friendly message for email already in use', () => {
      const error = {
        code: 'auth/email-already-in-use',
        message: 'The email address is already in use.',
      };

      const message = getFirebaseErrorMessage(error);
      expect(message).toBe('Ya existe una cuenta con este correo');
    });

    it('should return original message for unknown error codes', () => {
      const error = {
        code: 'auth/unknown-error',
        message: 'Something went wrong.',
      };

      const message = getFirebaseErrorMessage(error);
      expect(message).toBe('Something went wrong.');
    });

    it('should return default message when error has no code', () => {
      const error = {
        message: 'Some error message',
      };

      const message = getFirebaseErrorMessage(error);
      expect(message).toBe('Some error message');
    });

    it('should return default message when error is null', () => {
      const error = null;

      const message = getFirebaseErrorMessage(error);
      expect(message).toBe('Ha ocurrido un error inesperado');
    });

    it('should handle permission denied errors', () => {
      const error = {
        code: 'firestore/permission-denied',
        message: 'Missing or insufficient permissions.',
      };

      const message = getFirebaseErrorMessage(error);
      expect(message).toBe('No tienes permisos para realizar esta acción');
    });

    it('should handle not found errors', () => {
      const error = {
        code: 'firestore/not-found',
        message: 'No document to update.',
      };

      const message = getFirebaseErrorMessage(error);
      expect(message).toBe('El documento solicitado no existe');
    });
  });

  describe('handleFirebaseError', () => {
    it('should call alert with friendly message', () => {
      const showAlert = jest.fn();
      const error = {
        code: 'auth/wrong-password',
        message: 'The password is invalid.',
      };

      handleFirebaseError(error, showAlert);

      expect(showAlert).toHaveBeenCalledWith('La contraseña es incorrecta');
    });

    it('should log error to console', () => {
      const showAlert = jest.fn();
      const error = {
        code: 'auth/invalid-email',
        message: 'The email address is badly formatted.',
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      handleFirebaseError(error, showAlert);

      expect(consoleSpy).toHaveBeenCalledWith('Firebase Error:', error);

      consoleSpy.mockRestore();
    });
  });
});
