import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/colors';
import StreakBadge from './StreakBadge';

interface Achievement {
  id: string;
  title: string;
  description: string;
}

const ACHIEVEMENTS: Record<string, Achievement> = {
  first_3_days: { title: '🔥 3 días seguidos', description: 'Has mantenido tu rutina 3 días consecutivos' },
  first_week: { title: '🌟 Primera semana', description: '7 días de consistencia en tu protocolo' },
  two_weeks: { title: '⚡ Dos semanas', description: '14 días sin romper la racha' },
  one_month: { title: '🏆 Un mes completo', description: '30 días de disciplina impecable' },
};

interface AchievementsListProps {
  achievements: string[];
}

export default function AchievementsList({ achievements }: AchievementsListProps) {
  if (achievements.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Logros</Text>
      {achievements.map((achievementId) => {
        const achievement = ACHIEVEMENTS[achievementId];
        if (!achievement) return null;
        return (
          <View key={achievementId} style={styles.achievementItem}>
            <Text style={styles.achievementTitle}>{achievement.title}</Text>
            <Text style={styles.achievementDescription}>{achievement.description}</Text>
          </View>
        );
      })}
    </View>
  );
}

export { ACHIEVEMENTS };

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  achievementItem: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  achievementTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementDescription: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
});
