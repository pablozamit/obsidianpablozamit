import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLORS, CATEGORIES } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { SuplementoDetalleScreenProps } from '../types';

export default function SuplementoDetalleScreen({ route, navigation }: SuplementoDetalleScreenProps) {
  const { id } = route.params;
  const [suplemento, setSuplemento] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuplemento = async () => {
      const docRef = doc(db, 'suplementos', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSuplemento({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    };
    fetchSuplemento();
  }, [id]);

  const handleEliminar = () => {
    Alert.alert(
      'Eliminar Suplemento',
      '¿Estás seguro de que quieres eliminar este suplemento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteDoc(doc(db, 'suplementos', id));
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!suplemento) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Suplemento no encontrado</Text>
      </View>
    );
  }

  const categoria = CATEGORIES[suplemento.categoria as keyof typeof CATEGORIES];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.categoriaBadge, { backgroundColor: categoria.color + '20' }]}>
          <Text style={[styles.categoriaText, { color: categoria.color }]}>{categoria.label}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditSuplemento', { suplementoId: id })}>
            <Ionicons name="create-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleEliminar}>
            <Ionicons name="trash-outline" size={24} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.nombre}>{suplemento.nombre}</Text>
      <Text style={styles.dosis}>{suplemento.dosis}</Text>

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color={COLORS.textMuted} />
          <Text style={styles.infoLabel}>Frecuencia:</Text>
          <Text style={styles.infoValue}>{suplemento.frecuencia}</Text>
        </View>
        {suplemento.hora && (
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={COLORS.textMuted} />
            <Text style={styles.infoLabel}>Hora:</Text>
            <Text style={styles.infoValue}>{suplemento.hora}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.textMuted} />
          <Text style={styles.infoLabel}>Estado:</Text>
          <Text style={[styles.infoValue, { color: suplemento.activo ? COLORS.success : COLORS.textMuted }]}>
            {suplemento.activo ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </View>

      {suplemento.notas && (
        <View style={styles.notasContainer}>
          <Text style={styles.notasTitle}>Notas</Text>
          <Text style={styles.notasText}>{suplemento.notas}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoriaBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoriaText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  nombre: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
  },
  dosis: {
    fontSize: 18,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  infoContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    color: COLORS.textMuted,
    marginLeft: 12,
    flex: 1,
  },
  infoValue: {
    color: COLORS.text,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  notasContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notasTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  notasText: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
});
