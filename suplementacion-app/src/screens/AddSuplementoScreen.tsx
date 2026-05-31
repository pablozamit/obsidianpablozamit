import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuthStore } from '../store';
import { AddSuplementoScreenProps } from '../types';
import SuplementoForm from '../components/SuplementoForm';
import Toast from '../components/Toast';
import { getFirebaseErrorMessage } from '../utils/errorHandler';

export default function AddSuplementoScreen({ navigation }: AddSuplementoScreenProps) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as const });
  const { usuario } = useAuthStore();

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  };

  const handleGuardar = async (data: {
    nombre: string;
    dosis: string;
    frecuencia: 'diario' | 'semanal' | 'mensual';
    hora: string;
    categoria: 'vitaminas' | 'minerales' | 'proteinas' | 'aminoacidos' | 'otros';
    notas: string;
    activo: boolean;
  }) => {
    if (!data.nombre || !data.dosis) {
      showToast('Nombre y dosis son obligatorios', 'error');
      return;
    }

    if (!usuario) {
      showToast('No hay usuario autenticado', 'error');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'suplementos'), {
        nombre: data.nombre,
        dosis: data.dosis,
        frecuencia: data.frecuencia,
        hora: data.hora || null,
        categoria: data.categoria,
        notas: data.notas || null,
        activo: true,
        usuarioId: usuario.uid,
        creadoEn: serverTimestamp(),
      });
      showToast('Suplemento añadido correctamente', 'success');
      setTimeout(() => navigation.goBack(), 500);
    } catch (error: any) {
      showToast(getFirebaseErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SuplementoForm
        navigation={navigation}
        isEditing={false}
        onSubmit={handleGuardar}
        loading={loading}
        submitButtonText="Guardar Suplemento"
      />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast({ ...toast, visible: false })}
      />
    </>
  );
}
