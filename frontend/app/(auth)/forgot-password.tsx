import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { api } from '../../src/services/api';
import { evaluatePasswordStrength } from '../../src/utils/password';

const OTP_RESEND_SECONDS = 30;

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const passwordStrength = evaluatePasswordStrength(newPassword);

  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const timer = setTimeout(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [secondsRemaining]);

  const handleSendOtp = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      Alert.alert(t('Error'), t('Please enter a valid registered email address'));
      return;
    }

    setIsSendingOtp(true);
    try {
      const response = await api.requestForgotPasswordOtp(trimmedEmail);
      setOtpRequested(true);
      setOtp('');
      setSecondsRemaining(OTP_RESEND_SECONDS);

      if (__DEV__ && response?.otp) {
        Alert.alert(
          t('Success'),
          `${t('OTP has been sent to your registered email')}: ${trimmedEmail}\n\nOTP: ${response.otp}`
        );
      } else {
        Alert.alert(
          t('Success'),
          `${t('OTP has been sent to your registered email')}: ${trimmedEmail}. Please check your inbox and spam folder.`
        );
      }
    } catch (error: any) {
      Alert.alert(t('Error'), error?.response?.data?.detail || t('Failed to send OTP'));
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResetPassword = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !otp.trim() || !newPassword || !confirmPassword) {
      Alert.alert(t('Error'), t('Please fill in all fields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('Error'), t('Passwords do not match'));
      return;
    }

    if (!passwordStrength.isStrong) {
      const guidance = passwordStrength.unmetLabels.map((item) => `- ${t(item)}`).join('\n');
      Alert.alert(t('Error'), `${t('Password is too weak')}\n\n${guidance}`);
      return;
    }

    setIsResetting(true);
    try {
      await api.resetForgotPassword(trimmedEmail, otp.trim(), newPassword, confirmPassword);
      Alert.alert(
        t('Success'),
        t('Password reset successful. Please sign in with your new password.'),
        [{ text: t('OK'), onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {
      Alert.alert(t('Error'), error?.response?.data?.detail || t('Failed to reset password'));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>{t('Forgot Password')}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t('Enter your registered email to receive a secure password reset OTP')}
          </Text>

          <View style={styles.form}>
            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
              <Ionicons name="mail-outline" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder={t('Registered email address')}
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.otpButton,
                { backgroundColor: secondsRemaining > 0 ? theme.card : theme.primary },
              ]}
              onPress={handleSendOtp}
              disabled={isSendingOtp || secondsRemaining > 0}
            >
              {isSendingOtp ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.otpButtonText}>
                  {otpRequested ? (secondsRemaining > 0 ? `${t('Resend OTP')} (${secondsRemaining}s)` : t('Resend OTP')) : t('Send OTP to Email')}
                </Text>
              )}
            </TouchableOpacity>

            {otpRequested && (
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                {secondsRemaining > 0
                  ? t('Resend OTP in {seconds}s', { seconds: secondsRemaining })
                  : t('Did not receive OTP? You can resend now.')}
              </Text>
            )}

            {otpRequested && (
              <>
                <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
                  <Ionicons name="key-outline" size={20} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder={t('Enter 6-digit OTP')}
                    placeholderTextColor={theme.textSecondary}
                    value={otp}
                    onChangeText={(text) => setOtp(text.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>

                <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder={t('New Password')}
                    placeholderTextColor={theme.textSecondary}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder={t('Confirm New Password')}
                    placeholderTextColor={theme.textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                  />
                </View>

                <View
                  style={[
                    styles.passwordCheckWrap,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.passwordCheckTitle, { color: theme.text }]}>
                    {t('Password checker')}
                  </Text>
                  {passwordStrength.checks.map((rule) => (
                    <View key={rule.key} style={styles.passwordCheckRow}>
                      <Ionicons
                        name={rule.passed ? 'checkmark-circle' : 'ellipse-outline'}
                        size={14}
                        color={rule.passed ? theme.success : theme.textSecondary}
                      />
                      <Text
                        style={[
                          styles.passwordCheckText,
                          { color: rule.passed ? theme.success : theme.textSecondary },
                        ]}
                      >
                        {t(rule.label)}
                      </Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: theme.primary }]}
                  onPress={handleResetPassword}
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>{t('Reset Password')}</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  headerRow: {
    marginBottom: 16,
  },
  iconButton: {
    padding: 4,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 8,
  },
  form: {
    marginTop: 20,
    gap: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 56,
  },
  phonePrefix: {
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  otpButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 12,
    marginTop: -4,
  },
  passwordCheckWrap: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  passwordCheckTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  passwordCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passwordCheckText: {
    fontSize: 12,
    flex: 1,
  },
  submitButton: {
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
