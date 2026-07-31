import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';

export default function CatalogLayout() {
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
        contentStyle: {
          backgroundColor: colors.background,
          ...(Platform.OS === 'web' ? {} : {}),
        },
      }}
    />
  );
}
