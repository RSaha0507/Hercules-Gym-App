import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/services/api';

function parseQrPayload(raw: string): { code: string } {
  const value = raw.trim();
  if (!value) return { code: '' };

  // Support JSON payloads: {"code":"..."}
  if (value.startsWith('{') && value.endsWith('}')) {
    try {
      const parsedJson = JSON.parse(value);
      const code = String(parsedJson?.code || '').trim();
      return { code };
    } catch {
      // Ignore JSON parse failures and continue with URL/plain parsing.
    }
  }

  // Support URL payloads: herculesgym://attendance?code=...
  try {
    const parsed = new URL(value);
    const fromQuery = String(parsed.searchParams.get('code') || '').trim();
    return { code: fromQuery || value };
  } catch {
    return { code: value };
  }
}

export default function CheckInQrScreen() {
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);

  const canScan = useMemo(
    () => !!permission?.granted && !scanLocked && !isSubmitting && !isResolvingLocation,
    [permission?.granted, scanLocked, isSubmitting, isResolvingLocation],
  );

  const resolveScanLocation = useCallback(async () => {
    let granted = !!locationPermission?.granted;

    if (!granted) {
      const requested = await requestLocationPermission();
      granted = !!requested?.granted;
    }

    if (!granted) {
      throw new Error('Location permission is required for secure QR attendance.');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy_m: typeof location.coords.accuracy === 'number' ? location.coords.accuracy : undefined,
      is_mocked: Boolean((location as any)?.mocked || (location.coords as any)?.mocked),
    };
  }, [locationPermission?.granted, requestLocationPermission]);

  const submitCode = useCallback(
    async (rawCode: string) => {
      const parsed = parseQrPayload(rawCode);
      const code = parsed.code;
      if (!code) {
        return;
      }
      setIsSubmitting(true);
      setIsResolvingLocation(true);
      try {
        const scanLocation = await resolveScanLocation();
        setIsResolvingLocation(false);

        const response = await api.qrScan(code, scanLocation);
        const action = response?.action === 'checkout' ? 'checkout' : 'checkin';
        let title = action === 'checkout' ? 'Check-out successful' : 'Check-in successful';
        let message =
          action === 'checkout'
            ? 'You have been checked out via QR. Next check-in is available after 5 hours.'
            : 'Your attendance has been marked via QR.';
        if (action === 'checkin') {
          title = 'Check-in successful';
          message = 'Your attendance has been marked via QR.';
        }
        Alert.alert(title, message, [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/attendance' as any),
          },
        ]);
      } catch (error: any) {
        setIsResolvingLocation(false);
        Alert.alert(
          'QR attendance failed',
          error.response?.data?.detail || error.message || 'Unable to mark attendance using this QR code.',
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [resolveScanLocation],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#F2FBFF" />
          </TouchableOpacity>
          <Text style={styles.title}>QR Attendance</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>
            {'Scan the same attendance QR. 1st scan checks in, next scan checks out. Re-check-in is allowed after 5 hours.'}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={[styles.subtitleInfo, { color: theme.textSecondary }]}>
          {'Use the same QR for both check-in and check-out. Scan works only inside your gym center perimeter.'}
        </Text>

        <View style={[styles.scannerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {!permission ? (
            <ActivityIndicator color={theme.primary} />
          ) : !permission.granted ? (
            <View style={styles.permissionWrap}>
              <Ionicons name="camera-outline" size={42} color={theme.textSecondary} />
              <Text style={[styles.permissionText, { color: theme.textSecondary }]}>
                Camera access is required to scan QR codes.
              </Text>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                onPress={requestPermission}
              >
                <Text style={styles.primaryButtonText}>Allow Camera</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cameraWrap}>
              <CameraView
                style={styles.camera}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={
                  canScan
                    ? ({ data }) => {
                        setScanLocked(true);
                        submitCode(data).finally(() => {
                          setTimeout(() => setScanLocked(false), 900);
                        });
                      }
                    : undefined
                }
              />
            </View>
          )}
        </View>
        <View style={[styles.securityHintCard, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <Ionicons name="shield-checkmark-outline" size={18} color={theme.primary} />
          <Text style={[styles.securityHintText, { color: theme.textSecondary }]}>
            Security check: GPS location and anti-mock checks are required for QR attendance.
          </Text>
        </View>
        {!locationPermission?.granted && (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={requestLocationPermission}
            disabled={isResolvingLocation}
          >
            <Text style={styles.primaryButtonText}>Allow Location</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    marginHorizontal: 14,
    marginTop: 8,
    borderRadius: 26,
    overflow: 'hidden',
    paddingBottom: 10,
    shadowColor: '#0A1422',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  backButton: { padding: 4 },
  title: { fontSize: 20, fontWeight: '800', color: '#F3FCFF' },
  content: { paddingHorizontal: 20, gap: 14 },
  subtitle: { fontSize: 13, lineHeight: 19, color: '#D4EDFF' },
  subtitleInfo: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  scannerCard: {
    height: 280,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  permissionText: {
    textAlign: 'center',
    fontSize: 14,
  },
  cameraWrap: { width: '100%', height: '100%' },
  camera: { flex: 1 },
  securityHintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 2,
  },
  securityHintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  primaryButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
