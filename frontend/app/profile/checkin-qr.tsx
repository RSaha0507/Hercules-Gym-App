import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/services/api';

function extractQrCodeValue(raw: string): string {
  const value = raw.trim();
  if (!value) return '';
  try {
    const parsed = new URL(value);
    const fromQuery = parsed.searchParams.get('code');
    return (fromQuery || value).trim();
  } catch {
    return value;
  }
}

export default function CheckInQrScreen() {
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [codeInput, setCodeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);

  const canScan = useMemo(
    () => !!permission?.granted && !scanLocked && !isSubmitting,
    [permission?.granted, scanLocked, isSubmitting],
  );

  const submitCode = useCallback(
    async (rawCode: string) => {
      const code = extractQrCodeValue(rawCode);
      if (!code) {
        return;
      }
      setIsSubmitting(true);
      try {
        await api.qrCheckIn(code);
        Alert.alert('Check-in successful', 'Your attendance has been marked via QR.');
        setCodeInput('');
      } catch (error: any) {
        Alert.alert('Check-in failed', error.response?.data?.detail || 'Unable to check in using this QR code.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>QR Check-In</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Scan your gym QR code, or enter the code manually.
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

        <View style={styles.manualWrap}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBg,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="Enter QR code"
            placeholderTextColor={theme.textSecondary}
            value={codeInput}
            onChangeText={setCodeInput}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            disabled={isSubmitting || !codeInput.trim()}
            onPress={() => submitCode(codeInput)}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Check In</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backButton: { padding: 4 },
  title: { fontSize: 20, fontWeight: '700' },
  content: { paddingHorizontal: 20, gap: 14 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  scannerCard: {
    height: 280,
    borderRadius: 16,
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
  manualWrap: { gap: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 16,
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
