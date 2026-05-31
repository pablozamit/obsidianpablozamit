import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import StreakBadge from './StreakBadge';

interface StreakStatsProps {
  currentStreak: number;
  bestStreak: number;
  size?: 'small' | 'medium' | 'large';
}

export default function StreakStats({ currentStreak, bestStreak, size = 'medium' }: StreakStatsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Actual</Text>
        <Text style={styles.statValue}>{currentStreak}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Récord</Text>
        <Text style={styles.statValue}>{bestStreak}</Text>
      </View>

      <TouchableOpacity style={styles.shareButton}>
        <Ionicons name="share-outline" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  shareButton: {
    padding: 8,
  },
});
