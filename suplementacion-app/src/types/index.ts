import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export interface Suplemento {
  id: string;
  nombre: string;
  dosis: string;
  frecuencia: 'diario' | 'semanal' | 'mensual';
  hora?: string;
  categoria: 'vitaminas' | 'minerales' | 'proteinas' | 'aminoacidos' | 'otros';
  notas?: string;
  activo: boolean;
  creadoEn: Date;
  usuarioId: string;
}

export interface Usuario {
  uid: string;
  email: string;
  nombre: string;
  creadoEn: Date;
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  AddSuplemento: undefined;
  SuplementoDetalle: { id: string };
  EditSuplemento: { suplementoId: string };
};

export type CategoriaSuplemento = 'vitaminas' | 'minerales' | 'proteinas' | 'aminoacidos' | 'otros';

export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type AddSuplementoScreenProps = NativeStackScreenProps<RootStackParamList, 'AddSuplemento'>;
export type SuplementoDetalleScreenProps = NativeStackScreenProps<RootStackParamList, 'SuplementoDetalle'>;
export type EditSuplementoScreenProps = NativeStackScreenProps<RootStackParamList, 'EditSuplemento'>;
