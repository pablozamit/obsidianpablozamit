import '@testing-library/jest-native/extend-expect';
import { Text } from 'react-native';

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
}));

jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn(),
    loadAsync: jest.fn(),
  },
}));

jest.useFakeTimers();

global.alert = jest.fn();
