import { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { EditSuplementoScreenProps, CategoriaSuplemento } from '../types';
import SuplementoForm from '../components/SuplementoForm';
import Toast from '../components/Toast';
import { getFirebaseErrorMessage } from '../utils/errorHandler';

export default function EditSuplementoScreen({ navigation, route }: EditSuplementoScreenProps) {
  const { suplementoId } = route.params || {};
  const [initialData, setInitialData] = useState<{
    nombre: string;
    dosis: string;
    frecuencia: 'diario' | 'semanal' | 'mensual';
    hora: string;
    categoria: CategoriaSuplemento;
    notas: string;
    activo: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as const });
  const [dataLoading, setDataLoading] = useState(true);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  };

  useEffect(() => {
    if (suplementoId) {
      loadSuplemento();
    }
  }, [suplementoId]);

  const loadSuplemento = async () => {
    try {
      const docRef = doc(db, 'suplementos', suplementoId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setInitialData({
          nombre: data.nombre || '',
          dosis: data.dosis || '',
          frecuencia: data.frecuencia || 'diario',
          hora: data.hora || '',
          categoria: data.categoria || 'vitaminas',
          notas: data.notas || '',
          activo: data.activo !== undefined ? data.activo : true,
        });
      }
    } catch (error) {
      showToast('No se pudo cargar el suplemento', 'error');
    } finally {
      setDataLoading(false);
    }
  };

  const handleGuardar = async (data: {
    nombre: string;
    dosis: string;
    frecuencia: 'diario' | 'semanal' | 'mensual';
    hora: string;
    categoria: CategoriaSuplemento;
    notas: string;
    activo: boolean;
  }) => {
    if (!data.nombre || !data.dosis) {
      showToast('Nombre y dosis son obligatorios', 'error');
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'suplementos', suplementoId), {
        nombre: data.nombre,
        dosis: data.dosis,
        frecuencia: data.frecuencia,
        hora: data.hora || null,
        categoria: data.categoria,
        notas: data.notas || null,
        activo: data.activo,
        actualizadoEn: serverTimestamp(),
      });
      showToast('Suplemento actualizado correctamente', 'success');
      setTimeout(() => navigation.goBack(), 500);
    } catch (error: any) {
      showToast(getFirebaseErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading || !initialData) {
    return null;
  }

  return (
    <>
      <SuplementoForm
        navigation={navigation}
        initialData={initialData}
        isEditing={true}
        onSubmit={handleGuardar}
        loading={loading}
        submitButtonText="Actualizar Suplemento"
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

        showToast('Suplemento actualizado correctamente', 'success');
      } else {
        await addDoc(collection(db, 'suplementos'), {
          nombre,
          dosis,
          frecuencia,
          hora: hora || null,
          categoria,
          notas: notas || null,
          activo: true,
          usuarioId: usuario.uid,
          creadoEn: serverTimestamp(),
        });
        showToast('Suplemento añadido correctamente', 'success');
      }
      setTimeout(() => navigation.goBack(), 500);
    } catch (error: any) {
      showToast(getFirebaseErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{isEditing ? 'Editar Suplemento' : 'Nuevo Suplemento'}</Text>

      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: vitamina D3"
        placeholderTextColor={COLORS.textMuted}
        value={nombre}
        onChangeText={setNombre}
      />

      <Text style={styles.label}>Dosis</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: 5000 UI"
        placeholderTextColor={COLORS.textMuted}
        value={dosis}
        onChangeText={setDosis}
      />

      <Text style={styles.label}>Frecuencia</Text>
      <View style={styles.pillContainer}>
        {FRECUENCIAS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.pill, frecuencia === f && styles.pillSelected]}
            onPress={() => setFrecuencia(f)}>
            <Text style={[styles.pillText, frecuencia === f && styles.pillTextSelected]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Hora (opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: 08:00"
        placeholderTextColor={COLORS.textMuted}
        value={hora}
        onChangeText={setHora}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Categoría</Text>
      <View style={styles.categoryContainer}>
        {Object.entries(CATEGORIES).map(([key, value]) => (
          <TouchableOpacity
            key={key}
            style={[styles.categoryChip, categoria === key && { backgroundColor: value.color }]}
            onPress={() => setCategoria(key as CategoriaSuplemento)}>
            <Text style={[styles.categoryText, categoria === key && { color: COLORS.background }]}>
              {value.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isEditing && (
        <>
          <Text style={styles.label}>Estado</Text>
          <View style={styles.pillContainer}>
            <TouchableOpacity
              style={[styles.pill, activo && styles.pillSelected]}
              onPress={() => setActivo(true)}>
              <Text style={[styles.pillText, activo && styles.pillTextSelected]}>Activo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pill, !activo && styles.pillSelected]}
              onPress={() => setActivo(false)}>
              <Text style={[styles.pillText, !activo && styles.pillTextSelected]}>Inactivo</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Text style={styles.label}>Notas (opcional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Notas adicionales..."
        placeholderTextColor={COLORS.textMuted}
        value={notas}
        onChangeText={setNotas}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity style={styles.button} onPress={handleGuardar} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Guardando...' : isEditing ? 'Actualizar Suplemento' : 'Guardar Suplemento'}</Text>
      </TouchableOpacity>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast({ ...toast, visible: false })}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pillContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillText: {
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  pillTextSelected: {
    color: COLORS.background,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryText: {
    color: COLORS.text,
    fontSize: 14,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
