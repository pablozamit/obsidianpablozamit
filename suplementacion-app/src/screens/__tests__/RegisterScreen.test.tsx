import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../RegisterScreen';
import { doc, setDoc } from 'firebase/firestore';

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

jest.mock('../../config/firebase', () => ({
  auth: {
    createUserWithEmailAndPassword: jest.fn(),
  },
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
}));

describe('RegisterScreen', () => {
  const mockNavigation = { goBack: jest.fn() };
  const mockUser = {
    user: {
      uid: 'test-uid',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Alert.alert = jest.fn();
    (doc as jest.Mock).mockReturnValue({});
    (setDoc as jest.Mock).mockResolvedValue({});
  });

  it('renders correctly', () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen navigation={mockNavigation as any} />);

    expect(getByPlaceholderText('Nombre')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Contraseña')).toBeTruthy();
    expect(getByPlaceholderText('Confirmar Contraseña')).toBeTruthy();
    expect(getByText('Crear Cuenta')).toBeTruthy();
  });

  it('shows error when fields are empty', () => {
    const { getByText } = render(<RegisterScreen navigation={mockNavigation as any} />);
    const registerButton = getByText('Crear Cuenta');

    fireEvent.press(registerButton);

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Por favor completa todos los campos');
  });

  it('shows error when passwords do not match', () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen navigation={mockNavigation as any} />);

    fireEvent.changeText(getByPlaceholderText('Nombre'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Contraseña'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirmar Contraseña'), 'different123');

    const registerButton = getByText('Crear Cuenta');
    fireEvent.press(registerButton);

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Las contraseñas no coinciden');
  });

  it('shows error when password is too short', () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen navigation={mockNavigation as any} />);

    fireEvent.changeText(getByPlaceholderText('Nombre'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Contraseña'), '12345');
    fireEvent.changeText(getByPlaceholderText('Confirmar Contraseña'), '12345');

    const registerButton = getByText('Crear Cuenta');
    fireEvent.press(registerButton);

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'La contraseña debe tener al menos 6 caracteres');
  });

  it('creates user successfully on valid registration', async () => {
    const { auth } = require('../../config/firebase');
    auth.createUserWithEmailAndPassword.mockResolvedValue(mockUser);

    const { getByPlaceholderText, getByText } = render(<RegisterScreen navigation={mockNavigation as any} />);

    fireEvent.changeText(getByPlaceholderText('Nombre'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Contraseña'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirmar Contraseña'), 'password123');

    const registerButton = getByText('Crear Cuenta');
    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(auth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(setDoc).toHaveBeenCalled();
      expect(mockNavigation.replace).toHaveBeenCalledWith('Home');
    });
  });

  it('handles registration errors', async () => {
    const authError = {
      code: 'auth/email-already-in-use',
      message: 'Email already in use.',
    };

    const { auth } = require('../../config/firebase');
    auth.createUserWithEmailAndPassword.mockRejectedValue(authError);

    const { getByPlaceholderText, getByText } = render(<RegisterScreen navigation={mockNavigation as any} />);

    fireEvent.changeText(getByPlaceholderText('Nombre'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Contraseña'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirmar Contraseña'), 'password123');

    const registerButton = getByText('Crear Cuenta');
    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Ya existe una cuenta con este correo');
    });
  });

  it('navigates back on login link press', () => {
    const { getByText } = render(<RegisterScreen navigation={mockNavigation as any} />);
    const loginLink = getByText('¿Ya tienes cuenta? Inicia Sesión');

    fireEvent.press(loginLink);

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });
});
