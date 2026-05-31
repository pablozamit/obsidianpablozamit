import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStreakStore } from '../store/streakStore';
import { COLORS } from '../constants/colors';
import StreakBadge from './StreakBadge';
import StreakStats from './StreakStats';
import { AchievementsList } from './AchievementsList';

export default function DailyCheckIn() {
  const { currentStreak, achievements, checkIn, getDailyProgress } = useStreakStore();
  const [isChecking, setIsChecking] = useState(false);

  const progress = getDailyProgress();
  const hasCheckedInToday = progress === 100;

  const handleCheckIn = async () => {
    if (hasCheckedInToday) return;

    setIsChecking(true);
    try {
      await checkIn();
    } catch (error) {
      console.error('Error in checkIn:', error);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Racha Diaria</Text>
        <StreakBadge streak={currentStreak} size="medium" />
      </View>

      <StreakStats currentStreak={currentStreak} bestStreak={useStreakStore.getState().bestStreak} />

      <TouchableOpacity
        style={[styles.checkInButton, hasCheckedInToday && styles.checkedInButton]}
        onPress={handleCheckIn}
        disabled={isChecking || hasCheckedInToday}>
        <Ionicons
          name={hasCheckedInToday ? 'checkmark-circle' : 'flag-outline'}
          size={24}
          color={COLORS.background}
          style={styles.buttonIcon}
        />
        <Text style={styles.checkInText}>
          {hasCheckedInToday ? 'Completado hoy' : 'Registrar día'}
        </Text>
        {!hasCheckedInToday && (
          <Text style={styles.checkInSubtext}>
            {isChecking ? 'Registrando...' : `+${currentStreak + 1} días`}
          </Text>
        )}
      </TouchableOpacity>

      <AchievementsList achievements={achievements} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  checkInButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  checkedInButton: {
    backgroundColor: COLORS.success,
  },
  buttonIcon: {
    marginBottom: 8,
  },
  checkInText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  checkInSubtext: {
    color: COLORS.background,
    fontSize: 12,
    opacity: 0.8,
  },
});
