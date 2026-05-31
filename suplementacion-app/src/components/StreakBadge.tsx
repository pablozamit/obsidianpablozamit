import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

interface StreakBadgeProps {
  streak: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export default function StreakBadge({ streak, size = 'medium', showLabel = true }: StreakBadgeProps) {
  const getSize = () => {
    switch (size) {
      case 'small': return { icon: 16, text: 12, padding: 6, gap: 2 };
      case 'large': return { icon: 28, text: 16, padding: 12, gap: 6 };
      default: return { icon: 20, text: 14, padding: 8, gap: 4 };
    }
  };

  const getStreakLevel = (streak: number) => {
    if (streak >= 30) return { color: COLORS.secondary, label: 'Maestro' };
    if (streak >= 14) return { color: '#FF6B6B', label: 'Experto' };
    if (streak >= 7) return { color: '#4ECDC4', label: 'Intermedio' };
    return { color: COLORS.primary, label: 'Principiante' };
  };

  const { icon: iconSize, text: textSize, padding, gap } = getSize();
  const { color, label } = getStreakLevel(streak);

  return (
    <View style={[styles.container, { padding, gap }]}>
      <Ionicons name="flame" size={iconSize} color={color} />
      <Text style={[styles.streakText, { fontSize: textSize, color }]}>
        {streak}
      </Text>
      {showLabel && (
        <Text style={[styles.labelText, { fontSize: textSize - 2, color }]}>
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  streakText: {
    fontWeight: 'bold',
  },
  labelText: {
    fontWeight: '600',
  },
});
