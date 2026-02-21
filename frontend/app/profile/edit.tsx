import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/services/api';

export default function EditProfileScreen() {
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();
  const toIndianPhoneDigits = (value: string) => value.replace(/\D/g, '').replace(/^91/, '').slice(0, 10);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: toIndianPhoneDigits(user?.phone || ''),
    address: '',
  });

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (formData.phone.length !== 10) {
      Alert.alert('Error', 'Phone must be exactly 10 digits');
      return;
    }

    setIsLoading(true);
    try {
      await api.updateProfile({
        full_name: formData.full_name,
        phone: `+91${formData.phone}`,
      });

      await refreshUser();
      
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
              {user?.profile_image ? (
                <Image source={{ uri: user.profile_image }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarText, { color: theme.primary }]}>
                  {user?.full_name?.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <TouchableOpacity style={[styles.changePhotoButton, { backgroundColor: theme.primary }]}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={[styles.formSection, { backgroundColor: theme.card }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                value={formData.full_name}
                onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                placeholder="Enter your name"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Email</Text>
              <TextInput
                style={[styles.input, styles.disabledInput, { backgroundColor: theme.inputBg, color: theme.textSecondary, borderColor: theme.border }]}
                value={user?.email}
                editable={false}
              />
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                Email cannot be changed
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Phone</Text>
              <View style={[styles.phoneInputWrap, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                <Text style={[styles.phonePrefix, { color: theme.textSecondary }]}>+91</Text>
                <TextInput
                  style={[styles.phoneInput, { color: theme.text }]}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: toIndianPhoneDigits(text) })}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>
          </View>

          {/* Role & Center Info */}
          <View style={[styles.infoSection, { backgroundColor: theme.card }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Role</Text>
              <View style={[styles.badge, { backgroundColor: theme.primary + '20' }]}>
                <Text style={[styles.badgeText, { color: theme.primary }]}>
                  {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1)}
                </Text>
              </View>
            </View>
            {user?.center && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Center</Text>
                <View style={[styles.badge, { backgroundColor: theme.secondary + '20' }]}>
                  <Ionicons name="location" size={12} color={theme.secondary} />
                  <Text style={[styles.badgeText, { color: theme.secondary }]}>{user.center}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  phoneInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  phonePrefix: {
    fontSize: 15,
    fontWeight: '600',
    marginRight: 6,
  },
  phoneInput: {
    flex: 1,
    height: 52,
    fontSize: 16,
  },
  disabledInput: {
    opacity: 0.7,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  infoSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  saveButton: {
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
