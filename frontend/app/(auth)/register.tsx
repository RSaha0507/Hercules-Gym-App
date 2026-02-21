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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { GYM_CENTERS, CenterType } from '../../src/services/api';

export default function RegisterScreen() {
  const { register } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'member' as 'admin' | 'trainer' | 'member',
    center: 'Ranaghat' as CenterType,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const formatIndianPhoneDigits = (text: string) => text.replace(/\D/g, '').slice(0, 10);

  const handleRegister = async () => {
    const { full_name, email, phone, password, confirmPassword, role, center } = formData;
    const phoneDigits = formatIndianPhoneDigits(phone);

    if (!full_name || !email || !phone || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (phoneDigits.length !== 10) {
      Alert.alert('Error', 'Phone must be exactly 10 digits');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if ((role === 'trainer' || role === 'member') && !center) {
      Alert.alert('Error', 'Please select a gym center');
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
      });
      
      // Show approval message
      if (role !== 'admin' || (role === 'admin' && true)) {
        Alert.alert(
          'Registration Submitted',
          role === 'admin' || role === 'trainer'
            ? 'Your registration is pending approval from the primary admin.'
            : 'Your registration is pending approval from a trainer at your center.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
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

          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Join Hercules Gym today
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: theme.text }]}>I am a:</Text>
            <View style={styles.roleContainer}>
              <RoleButton role="member" label="Member" icon="person" />
              <RoleButton role="trainer" label="Trainer" icon="fitness" />
              <RoleButton role="admin" label="Admin" icon="shield" />
            </View>

            {formData.role !== 'admin' && (
              <>
                <Text style={[styles.label, { color: theme.text }]}>Select Gym Center:</Text>
                <View style={styles.centerContainer}>
                  {GYM_CENTERS.map((center) => (
                    <CenterButton key={center} center={center} />
                  ))}
                </View>
              </>
            )}

            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
              <Ionicons name="person-outline" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Full Name"
                placeholderTextColor={theme.textSecondary}
                value={formData.full_name}
                onChangeText={(text) => setFormData({ ...formData, full_name: text })}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
              <Ionicons name="mail-outline" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Email"
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
                placeholder="10-digit mobile number"
                placeholderTextColor={theme.textSecondary}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: formatIndianPhoneDigits(text) })}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Password"
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

            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Confirm Password"
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
                  ? 'Your registration requires approval from the primary admin.'
                  : 'Your registration requires approval from a trainer at your selected center.'}
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
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: theme.textSecondary }]}>
                Already have an account?
              </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={[styles.loginLink, { color: theme.primary }]}> Login</Text>
              </TouchableOpacity>
            </View>
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
