import React, { useState } from 'react';
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { GYM_CENTERS, CenterType } from '../../src/services/api';
import { evaluatePasswordStrength } from '../../src/utils/password';

export default function RegisterScreen() {
  const { register } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'member' as 'admin' | 'trainer' | 'member',
    center: 'Ranaghat' as CenterType,
    date_of_birth: null as Date | null,
    profile_image: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const passwordStrength = evaluatePasswordStrength(formData.password);
  const formatIndianPhoneDigits = (text: string) => text.replace(/\D/g, '').slice(0, 10);
  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
  const formatDateDisplay = (value: Date | null) => {
    if (!value) return t('Select DOB');
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const year = value.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const formatDatePayload = (value: Date) => {
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const year = value.getFullYear();
    return `${year}-${month}-${day}T00:00:00`;
  };

  const pickProfilePhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('Error'), t('Gallery permission is required to upload profile photo.'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets.length) return;
      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert(t('Error'), t('Could not process selected photo. Please try another image.'));
        return;
      }

      const mime = asset.mimeType || 'image/jpeg';
      setFormData((prev) => ({ ...prev, profile_image: `data:${mime};base64,${asset.base64}` }));
    } catch {
      Alert.alert(t('Error'), t('Could not process selected photo. Please try another image.'));
    }
  };

  const handleRegister = async () => {
    const { full_name, email, phone, password, confirmPassword, role, center, date_of_birth, profile_image } = formData;
    const phoneDigits = formatIndianPhoneDigits(phone);

    if (!full_name || !email || !phone || !password) {
      Alert.alert(t('Error'), t('Please fill in all fields'));
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert(t('Invalid Email'), t('Please enter a valid email address to continue.'));
      return;
    }

    if (phoneDigits.length !== 10) {
      Alert.alert(t('Error'), t('Phone must be exactly 10 digits'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('Error'), t('Passwords do not match'));
      return;
    }

    if (!passwordStrength.isStrong) {
      const guidance = passwordStrength.unmetLabels.map((item) => `- ${t(item)}`).join('\n');
      Alert.alert(t('Error'), `${t('Password is too weak')}\n\n${guidance}`);
      return;
    }

    if ((role === 'trainer' || role === 'member') && !center) {
      Alert.alert(t('Error'), t('Please select a gym center'));
      return;
    }

    if ((role === 'member' || role === 'trainer') && !date_of_birth) {
      Alert.alert(t('Error'), t('DOB is required'));
      return;
    }

    setIsLoading(true);
    try {
      await register({
        full_name,
        email: email.toLowerCase().trim(),
        phone: `+91${phoneDigits}`,
        password,
        role,
        center: role !== 'admin' ? center : undefined,
        date_of_birth:
          (role === 'member' || role === 'trainer') && date_of_birth
            ? formatDatePayload(date_of_birth)
            : undefined,
        profile_image: profile_image || undefined,
      });
      
      // Show approval message
      if (role !== 'admin' || (role === 'admin' && true)) {
        Alert.alert(
          t('Registration Submitted'),
          role === 'admin' || role === 'trainer'
            ? t('Your registration is pending approval from the primary admin.')
            : t('Your registration is pending approval from a trainer at your center.'),
          [{ text: 'OK' }],
        );
      }
    } catch (error: any) {
      Alert.alert(t('Registration Failed'), error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const RoleButton = ({ role, label, icon }: { role: 'admin' | 'trainer' | 'member'; label: string; icon: string }) => (
    <TouchableOpacity
      style={[
        styles.roleButton,
        {
          backgroundColor: formData.role === role ? theme.primary : theme.inputBg,
          borderColor: formData.role === role ? theme.primary : theme.border,
        },
      ]}
      onPress={() => setFormData({ ...formData, role })}
    >
      <Ionicons
        name={icon as any}
        size={20}
        color={formData.role === role ? '#FFF' : theme.textSecondary}
      />
      <Text
        style={[
          styles.roleButtonText,
          { color: formData.role === role ? '#FFF' : theme.text },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const CenterButton = ({ center }: { center: CenterType }) => (
    <TouchableOpacity
      style={[
        styles.centerButton,
        {
          backgroundColor: formData.center === center ? theme.primary : theme.inputBg,
          borderColor: formData.center === center ? theme.primary : theme.border,
        },
      ]}
      onPress={() => setFormData({ ...formData, center })}
    >
      <Ionicons
        name="location"
        size={16}
        color={formData.center === center ? '#FFF' : theme.textSecondary}
      />
      <Text
        style={[
          styles.centerButtonText,
          { color: formData.center === center ? '#FFF' : theme.text },
        ]}
      >
        {center}
      </Text>
    </TouchableOpacity>
  );

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
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleTheme}>
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {isDark && (
            <View style={styles.darkLogoContainer}>
              <Image
                source={require('../../assets/images/hercules-logo.png')}
                style={styles.darkLogo}
                resizeMode="contain"
              />
            </View>
          )}

          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.text }]}>{t('Create Account')}</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {t('Join Hercules Gym today')}
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: theme.text }]}>{t('I am a:')}</Text>
            <View style={styles.roleContainer}>
              <RoleButton role="member" label={t('Member')} icon="person" />
              <RoleButton role="trainer" label={t('Trainer')} icon="fitness" />
              <RoleButton role="admin" label={t('Admin')} icon="shield" />
            </View>

            {formData.role !== 'admin' && (
              <>
                <Text style={[styles.label, { color: theme.text }]}>{t('Select Gym Center:')}</Text>
                <View style={styles.centerContainer}>
                  {GYM_CENTERS.map((center) => (
                    <CenterButton key={center} center={center} />
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.photoPicker, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
              onPress={pickProfilePhoto}
            >
              {formData.profile_image ? (
                <Image source={{ uri: formData.profile_image }} style={styles.photoPreview} />
              ) : (
                <View style={[styles.photoPlaceholder, { backgroundColor: theme.primary + '20' }]}>
                  <Ionicons name="camera-outline" size={20} color={theme.primary} />
                </View>
              )}
              <View style={styles.photoTextWrap}>
                <Text style={[styles.photoTitle, { color: theme.text }]}>{t('Profile Photo')}</Text>
                <Text style={[styles.photoSubtitle, { color: theme.textSecondary }]}>
                  {formData.profile_image ? t('Change Photo') : t('Upload Photo')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
              <Ionicons name="person-outline" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder={t('Full Name')}
                placeholderTextColor={theme.textSecondary}
                value={formData.full_name}
                onChangeText={(text) => setFormData({ ...formData, full_name: text })}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
              <Ionicons name="mail-outline" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder={t('Email')}
                placeholderTextColor={theme.textSecondary}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
              <Ionicons name="call-outline" size={20} color={theme.textSecondary} />
              <Text style={[styles.phonePrefix, { color: theme.textSecondary }]}>+91</Text>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder={t('10-digit mobile number')}
                placeholderTextColor={theme.textSecondary}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: formatIndianPhoneDigits(text) })}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
              <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
              <TouchableOpacity style={styles.dateInputButton} onPress={() => setShowDobPicker(true)}>
                <Text
                  style={[
                    styles.dateInputText,
                    { color: formData.date_of_birth ? theme.text : theme.textSecondary },
                  ]}
                >
                  {formatDateDisplay(formData.date_of_birth)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder={t('Password')}
                placeholderTextColor={theme.textSecondary}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={[styles.passwordCheckWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.passwordCheckTitle, { color: theme.text }]}>{t('Password checker')}</Text>
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

            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder={t('Confirm Password')}
                placeholderTextColor={theme.textSecondary}
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                secureTextEntry={!showPassword}
              />
            </View>

            {/* Approval Info */}
            <View style={[styles.infoBox, { backgroundColor: theme.warning + '20' }]}>
              <Ionicons name="information-circle" size={20} color={theme.warning} />
              <Text style={[styles.infoText, { color: theme.text }]}>
                {formData.role === 'admin' || formData.role === 'trainer'
                  ? t('Your registration is pending approval from the primary admin.')
                  : t('Your registration is pending approval from a trainer at your center.')}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, { backgroundColor: theme.primary }]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.registerButtonText}>{t('Create Account')}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: theme.textSecondary }]}>
                {t('Already have an account?')}
              </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={[styles.loginLink, { color: theme.primary }]}> {t('Login')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {showDobPicker && (
        <DateTimePicker
          value={formData.date_of_birth || new Date(2000, 0, 1)}
          mode="date"
          maximumDate={new Date()}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selectedDate) => {
            setShowDobPicker(false);
            if (selectedDate) {
              setFormData((prev) => ({ ...prev, date_of_birth: selectedDate }));
            }
          }}
        />
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
  },
  titleContainer: {
    marginBottom: 24,
  },
  darkLogoContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  darkLogo: {
    width: 112,
    height: 112,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  centerContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  centerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  centerButtonText: {
    fontSize: 11,
    fontWeight: '500',
  },
  photoPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
  },
  photoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreview: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  photoTextWrap: {
    flex: 1,
  },
  photoTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  photoSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 56,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  dateInputButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  dateInputText: {
    fontSize: 16,
  },
  phonePrefix: {
    fontSize: 15,
    fontWeight: '600',
    marginRight: -4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
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
  registerButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
