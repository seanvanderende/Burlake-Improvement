import { Stack } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Platform } from 'react-native';

export default function FormsLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.secondary },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontFamily: 'DMSans_600SemiBold',
          fontSize: 18,
        },
        headerShadowVisible: false,
        headerBackTitle: '',
        // Web: leave room for the status bar at top
        contentStyle: Platform.OS === 'web'
          ? { backgroundColor: colors.background }
          : { backgroundColor: colors.background },
      }}
    />
  );
}
