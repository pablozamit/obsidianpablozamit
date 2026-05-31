import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { useAuthStore } from '../store';
import { Suplemento, CategoriaSuplemento, HomeScreenProps } from '../types';
import { COLORS, CATEGORIES } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import DailyCheckIn from '../components/DailyCheckIn';
import StreakBadge from '../components/StreakBadge';

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [suplementos, setSuplementos] = useState<Suplemento[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { usuario, logout } = useAuthStore();
  const [showGamification, setShowGamification] = useState(true);

  useEffect(() => {
    if (!usuario) {
      navigation.replace('Login');
      return;
    }

    const q = query(
      collection(db, 'suplementos'),
      where('usuarioId', '==', usuario.uid),
      orderBy('creadoEn', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        creadoEn: doc.data().creadoEn?.toDate(),
      })) as Suplemento[];
      setSuplementos(data);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, [usuario]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleActivo = async (id: string, activo: boolean) => {
    await updateDoc(doc(db, 'suplementos', id), { activo: !activo });
  };

  const renderSuplemento = ({ item }: { item: Suplemento }) => {
    const categoria = CATEGORIES[item.categoria as CategoriaSuplemento];
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('SuplementoDetalle', { id: item.id })}>
        <View style={[styles.categoriaBadge, { backgroundColor: categoria.color + '20' }]}>
          <Text style={[styles.categoriaText, { color: categoria.color }]}>{categoria.label}</Text>
        </View>
        <Text style={styles.nombre}>{item.nombre}</Text>
        <Text style={styles.dosis}>{item.dosis}</Text>
        <View style={styles.footer}>
          <Text style={styles.frecuencia}>{item.frecuencia}</Text>
          <TouchableOpacity
            style={[styles.activoBadge, { backgroundColor: item.activo ? COLORS.success : COLORS.surface }]}
            onPress={() => toggleActivo(item.id, item.activo)}>
            <Text style={styles.activoText}>{item.activo ? 'Activo' : 'Inactivo'}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="leaf-outline" size={64} color={COLORS.textMuted} />
      <Text style={styles.emptyTitle}>Sin suplementos</Text>
      <Text style={styles.emptySubtitle}>Añade tu primer suplemento para comenzar</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {usuario?.nombre}</Text>
          <Text style={styles.subtitle}>Tus suplementos</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.gamificationToggle}
            onPress={() => setShowGamification(!showGamification)}
          >
            <Ionicons name="trophy" size={20} color={showGamification ? COLORS.secondary : COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {showGamification && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gamificationSection}>
          <DailyCheckIn />
        </ScrollView>
      )}

      <FlatList
        data={suplementos}
        renderItem={renderSuplemento}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          showGamification && styles.listContentWithGamification
        ]}
        ListEmptyComponent={ListEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddSuplemento')}>
        <Ionicons name="add" size={32} color={COLORS.background} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gamificationToggle: {
    padding: 8,
  },
  logoutButton: {
    padding: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  listContentWithGamification: {
    paddingTop: 0,
  },
  gamificationSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoriaBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoriaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  nombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  dosis: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  frecuencia: {
    fontSize: 12,
    color: COLORS.textMuted,
    textTransform: 'capitalize',
  },
  activoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activoText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
