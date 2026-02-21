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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/services/api';

export default function CreateAnnouncementScreen() {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target: 'all' as 'all' | 'members' | 'trainers' | 'selected',
  });

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await api.createAnnouncement(formData);
      Alert.alert('Success', 'Announcement created successfully');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create announcement');
    } finally {
      setIsLoading(false);
    }
  };

  const TargetButton = ({ value, label, icon }: { value: typeof formData.target; label: string; icon: string }) => (
    <TouchableOpacity
      style={[
        styles.targetButton,
        {
          backgroundColor: formData.target === value ? theme.primary : theme.inputBg,
          borderColor: formData.target === value ? theme.primary : theme.border,
        },
      ]}
      onPress={() => setFormData({ ...formData, target: value })}
    >
      <Ionicons
        name={icon as any}
        size={20}
        color={formData.target === value ? '#FFF' : theme.textSecondary}
      />
      <Text
        style={[
          styles.targetButtonText,
          { color: formData.target === value ? '#FFF' : theme.text },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>New Announcement</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Title</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text }]}
              placeholder="Enter announcement title"
              placeholderTextColor={theme.textSecondary}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />
          </View>

          {/* Content */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Content</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.inputBg, color: theme.text }]}
              placeholder="Enter announcement content"
              placeholderTextColor={theme.textSecondary}
              value={formData.content}
              onChangeText={(text) => setFormData({ ...formData, content: text })}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Target Audience */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Send To</Text>
            <View style={styles.targetContainer}>
              <TargetButton value="all" label="Everyone" icon="people" />
              <TargetButton value="members" label="Members" icon="person" />
              <TargetButton value="trainers" label="Trainers" icon="fitness" />
            </View>
          </View>

          {/* Preview */}
          {formData.title && (
            <View style={styles.previewContainer}>
              <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>Preview</Text>
              <View style={[styles.previewCard, { backgroundColor: theme.card }]}>
                <View style={styles.previewHeader}>
                  <Ionicons name="megaphone" size={20} color={theme.primary} />
                  <Text style={[styles.previewTitle, { color: theme.text }]}>
                    {formData.title}
                  </Text>
                </View>
                <Text style={[styles.previewContent, { color: theme.textSecondary }]}>
                  {formData.content || 'Your announcement content will appear here...'}
                </Text>
              </View>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.primary }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#FFF" />
                <Text style={styles.submitButtonText}>Send Announcement</Text>
              </>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
  },
  textArea: {
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    minHeight: 150,
  },
  targetContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  targetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  targetButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  previewContainer: {
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  previewCard: {
    padding: 16,
    borderRadius: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
