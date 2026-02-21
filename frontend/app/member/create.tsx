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
import { useAuth } from '../../src/context/AuthContext';
import { api, GYM_CENTERS, CenterType } from '../../src/services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateMemberScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  
  // Default to trainer's center if trainer, otherwise first center
  const defaultCenter = user?.role === 'trainer' && user?.center ? user.center : 'Ranaghat';
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    center: defaultCenter as CenterType,
    gender: '',
    address: '',
    medical_notes: '',
    goals: '',
    emergency_name: '',
    emergency_phone: '',
    emergency_relationship: '',
    plan_name: '',
    plan_amount: '',
    start_date: new Date(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  });

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.email || !formData.phone || !formData.password || !formData.center) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const data: any = {
        full_name: formData.full_name,
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone,
        password: formData.password,
        center: formData.center,
        gender: formData.gender || null,
        address: formData.address || null,
        medical_notes: formData.medical_notes || null,
        goals: formData.goals || null,
      };

      if (formData.emergency_name && formData.emergency_phone) {
        data.emergency_contact = {
          name: formData.emergency_name,
          phone: formData.emergency_phone,
          relationship: formData.emergency_relationship || 'Other',
        };
      }

      if (formData.plan_name && formData.plan_amount) {
        data.membership = {
          plan_name: formData.plan_name,
          start_date: formData.start_date.toISOString(),
          end_date: formData.end_date.toISOString(),
          amount: parseFloat(formData.plan_amount),
          is_active: true,
        };
      }

      await api.createMember(data);
      Alert.alert('Success', 'Member created successfully');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create member');
    } finally {
      setIsLoading(false);
    }
  };

  const InputField = ({ 
    label, 
    value, 
    onChangeText, 
    placeholder,
    required = false,
    ...props 
  }: any) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: theme.text }]}>
        {label} {required && <Text style={{ color: theme.error }}>*</Text>}
      </Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text }]}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Add New Member</Text>
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
          {/* Basic Info */}
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Basic Information</Text>
            <InputField
              label="Full Name"
              value={formData.full_name}
              onChangeText={(text: string) => setFormData({ ...formData, full_name: text })}
              placeholder="Enter full name"
              required
            />
            <InputField
              label="Email"
              value={formData.email}
              onChangeText={(text: string) => setFormData({ ...formData, email: text })}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              required
            />
            <InputField
              label="Phone"
              value={formData.phone}
              onChangeText={(text: string) => setFormData({ ...formData, phone: text })}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              required
            />
            <InputField
              label="Password"
              value={formData.password}
              onChangeText={(text: string) => setFormData({ ...formData, password: text })}
              placeholder="Create password"
              secureTextEntry
              required
            />
            
            {/* Center Selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>
                Gym Center <Text style={{ color: theme.error }}>*</Text>
              </Text>
              <View style={styles.centerContainer}>
                {GYM_CENTERS.map((center) => (
                  <TouchableOpacity
                    key={center}
                    style={[
                      styles.centerButton,
                      {
                        backgroundColor: formData.center === center ? theme.primary : theme.inputBg,
                        borderColor: formData.center === center ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setFormData({ ...formData, center })}
                    disabled={user?.role === 'trainer'} // Trainers can only add to their center
                  >
                    <Ionicons
                      name="location"
                      size={14}
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
                ))}
              </View>
              {user?.role === 'trainer' && (
                <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                  Members will be added to your center ({user.center})
                </Text>
              )}
            </View>
            
            <InputField
              label="Gender"
              value={formData.gender}
              onChangeText={(text: string) => setFormData({ ...formData, gender: text })}
              placeholder="Male / Female / Other"
            />
            <InputField
              label="Address"
              value={formData.address}
              onChangeText={(text: string) => setFormData({ ...formData, address: text })}
              placeholder="Enter address"
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Membership */}
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Membership Plan</Text>
            <InputField
              label="Plan Name"
              value={formData.plan_name}
              onChangeText={(text: string) => setFormData({ ...formData, plan_name: text })}
              placeholder="e.g., Monthly, Quarterly, Annual"
            />
            <InputField
              label="Amount (₹)"
              value={formData.plan_amount}
              onChangeText={(text: string) => setFormData({ ...formData, plan_amount: text })}
              placeholder="Enter amount"
              keyboardType="numeric"
            />
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Start Date</Text>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: theme.inputBg }]}
                onPress={() => setShowStartDate(true)}
              >
                <Text style={{ color: theme.text }}>
                  {formData.start_date.toLocaleDateString()}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>End Date</Text>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: theme.inputBg }]}
                onPress={() => setShowEndDate(true)}
              >
                <Text style={{ color: theme.text }}>
                  {formData.end_date.toLocaleDateString()}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Emergency Contact */}
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Emergency Contact</Text>
            <InputField
              label="Contact Name"
              value={formData.emergency_name}
              onChangeText={(text: string) => setFormData({ ...formData, emergency_name: text })}
              placeholder="Enter name"
            />
            <InputField
              label="Contact Phone"
              value={formData.emergency_phone}
              onChangeText={(text: string) => setFormData({ ...formData, emergency_phone: text })}
              placeholder="Enter phone"
              keyboardType="phone-pad"
            />
            <InputField
              label="Relationship"
              value={formData.emergency_relationship}
              onChangeText={(text: string) => setFormData({ ...formData, emergency_relationship: text })}
              placeholder="e.g., Parent, Spouse, Friend"
            />
          </View>

          {/* Health & Goals */}
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Health & Goals</Text>
            <InputField
              label="Medical Notes"
              value={formData.medical_notes}
              onChangeText={(text: string) => setFormData({ ...formData, medical_notes: text })}
              placeholder="Any medical conditions or injuries"
              multiline
              numberOfLines={3}
            />
            <InputField
              label="Fitness Goals"
              value={formData.goals}
              onChangeText={(text: string) => setFormData({ ...formData, goals: text })}
              placeholder="What does the member want to achieve?"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.primary }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>Create Member</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Pickers */}
      {showStartDate && (
        <DateTimePicker
          value={formData.start_date}
          mode="date"
          onChange={(event, date) => {
            setShowStartDate(false);
            if (date) setFormData({ ...formData, start_date: date });
          }}
        />
      )}
      {showEndDate && (
        <DateTimePicker
          value={formData.end_date}
          mode="date"
          onChange={(event, date) => {
            setShowEndDate(false);
            if (date) setFormData({ ...formData, end_date: date });
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
  section: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  centerContainer: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  centerButton: {
    flex: 1,
    minWidth: '28%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  centerButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
