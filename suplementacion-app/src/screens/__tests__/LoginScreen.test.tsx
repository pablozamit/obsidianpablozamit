import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';
import { useAuthStore } from '../../store';

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

jest.mock('../../config/firebase', () => ({
  auth: {
    signInWithEmailAndPassword: jest.fn(),
  },
}));

jest.mock('../../store', () => ({
  useAuthStore: jest.fn(),
}));

describe('LoginScreen', () => {
  const mockSetUsuario = jest.fn();
  const mockNavigation = { replace: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as jest.Mock).mockReturnValue({
      setUsuario: mockSetUsuario,
      setLoading: jest.fn(),
      loading: false,
    });
    Alert.alert = jest.fn();
  });

  it('renders correctly', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen navigation={mockNavigation as any} />);

    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Contraseña')).toBeTruthy();
    expect(getByText('Entrar')).toBeTruthy();
    expect(getByText('¿No tienes cuenta? Regístrate')).toBeTruthy();
  });

  it('shows error when fields are empty', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation as any} />);
    const loginButton = getByText('Entrar');

    fireEvent.press(loginButton);

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Por favor completa todos los campos');
  });

  it('calls setUsuario on successful login', async () => {
    const mockUser = {
      user: {
        uid: 'test-uid',
        email: 'test@example.com',
      },
    };

    const { auth } = require('../../config/firebase');
    auth.signInWithEmailAndPassword.mockResolvedValue(mockUser);

    const { getByPlaceholderText, getByText } = render(<LoginScreen navigation={mockNavigation as any} />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Contraseña'), 'password123');

    const loginButton = getByText('Entrar');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(auth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(mockSetUsuario).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: 'test-uid',
          email: 'test@example.com',
        })
      );
    });
  });

  it('handles demo user login', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation as any} />);
    const demoButton = getByText('Entrar como invitado');

    fireEvent.press(demoButton);

    expect(mockSetUsuario).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: 'demo-user',
        email: 'demo@suplementacion.app',
      })
    );
    expect(mockNavigation.replace).toHaveBeenCalledWith('Home');
  });

  it('shows error message on login failure', async () => {
    const authError = {
      code: 'auth/wrong-password',
      message: 'The password is invalid.',
    };

    const { auth } = require('../../config/firebase');
    auth.signInWithEmailAndPassword.mockRejectedValue(authError);

    const { getByPlaceholderText, getByText } = render(<LoginScreen navigation={mockNavigation as any} />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Contraseña'), 'wrongpassword');

    const loginButton = getByText('Entrar');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'La contraseña es incorrecta');
    });
  });
});
