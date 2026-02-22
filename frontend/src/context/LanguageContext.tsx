import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLanguage = 'en' | 'bn';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => Promise<void>;
  t: (key: string, vars?: Record<string, string | number>) => string;
  languageLabel: string;
}

const LANGUAGE_STORAGE_KEY = 'app_language';

const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: 'English',
  bn: 'Bangla',
};

const BN_TRANSLATIONS: Record<string, string> = {
  'Home': 'Ghor',
  'Members': 'Sodoshyo',
  'Approvals': 'Onumodon',
  'Attendance': 'Uposthiti',
  'Shop': 'Dokan',
  'Chat': 'Chat',
  'Profile': 'Profile',
  'Language': 'Bhasha',
  'Select app language': 'App-er bhasha nirbachon korun',
  'Welcome back! Login to continue': 'Abar shagotom! Cholte login korun',
  'Email or +91 phone': 'Email ba +91 phone',
  'Password': 'Password',
  'Login': 'Login',
  "Don't have an account?": 'Account nei?',
  'Register': 'Register',
  'Error': 'Truti',
  'Please fill in all fields': 'Shob field puron korun',
  'Login Failed': 'Login byartho',
  'Create Account': 'Account toiri korun',
  'Join Hercules Gym today': 'Ajkei Hercules Gym-e join korun',
  'I am a:': 'Ami:',
  'Member': 'Member',
  'Trainer': 'Trainer',
  'Admin': 'Admin',
  'Select Gym Center:': 'Gym Center nirbachon korun:',
  'Full Name': 'Purno nam',
  'Email': 'Email',
  '10-digit mobile number': '10-digit mobile number',
  'Confirm Password': 'Password nischit korun',
  'Already have an account?': 'Age thekei account ache?',
  'Invalid Email': 'Invalid email',
  'Please enter a valid email address to continue.': 'Cholte ekta valid email din.',
  'Phone must be exactly 10 digits': 'Phone obosshoi 10 digit hote hobe',
  'Passwords do not match': 'Password milchhe na',
  'Password must be at least 6 characters': 'Password kompakhe 6 character hote hobe',
  'Please select a gym center': 'Gym center nirbachon korun',
  'Registration Submitted': 'Registration submit hoyeche',
  'Your registration is pending approval from the primary admin.': 'Apnar registration primary admin-er onumodoner opekkhay ache.',
  'Your registration is pending approval from a trainer at your center.': 'Apnar registration apnar center-er trainer-er onumodoner opekkhay ache.',
  'Registration Failed': 'Registration byartho',
  'Welcome back,': 'Abar shagotom,',
  'Quick Actions': 'Druto kaj',
  'Check In': 'Check In',
  'Messages': 'Barta',
  'Announcements': 'Ghoshona',
  'No announcements yet': 'Ekhono kono ghoshona nei',
  'Approval Pending': 'Onumodon opekkhay',
  'Your registration is awaiting approval. You will be notified once it is approved.': 'Apnar registration onumodoner opekkhay ache. Onumodon hole janano hobe.',
  'Check Status': 'Status dekhun',
  'All Centers': 'Shob center',
  'Total Members': 'Mot member',
  'Active': 'Sokriyo',
  'Trainers': 'Trainer',
  "Today's Attendance": 'Ajker uposthiti',
  'This Month Revenue': 'Ei masher ay',
  'Pending Approvals': 'Pending onumodon',
  'Pending Orders': 'Pending order',
  'Expiring Soon': 'Shighroi meyad shesh',
  'Your Center': 'Apnar center',
  'Assigned Members': 'Assigned member',
  'Unread Messages': 'Opothito barta',
  'Payment Due!': 'Payment due!',
  'Your subscription payment is due. Please contact the gym.': 'Subscription payment baki. Gym-er sathe jogajog korun.',
  'Active Membership': 'Sokriyo membership',
  'Membership Expired': 'Membership-er meyad shesh',
  'Member ID: {id}': 'Member ID: {id}',
  'This Month': 'Ei mash',
  "Today's Workout": 'Ajker workout',
  'Notifications': 'Notification',
  'Center': 'Center',
  'In': 'In',
  'Out': 'Out',
  '{days} days remaining': '{days} din baki',
  'Primary Admin': 'Primary admin',
  '{count} selected': '{count} selected',
  'Delete Announcement': 'Ghoshona muche felun',
  'This announcement will be removed for all users.': 'Ei ghoshona shob user-er jonno muche jabe.',
  'Cancel': 'Cancel',
  'Delete': 'Delete',
  'Failed to delete announcement': 'Ghoshona muchte byartho',
  'No conversations yet': 'Ekhono kono conversation nei',
  'Start a conversation': 'Conversation shuru korun',
  'Delete chat': 'Chat delete korun',
  'Delete all messages with {name}?': '{name}-er sathe shob message delete korben?',
  'Failed': 'Byartho',
  'Failed to delete conversation': 'Conversation delete korte byartho',
  'You can message admin, trainers, and members from your branch': 'Apni apnar branch-er admin, trainer, ar member-der message korte parben',
  'You can message all members and trainers in your branch, and all admins': 'Apni apnar branch-er shob member ar trainer-ke, ar shob admin-ke message korte parben',
  'You can message all members and trainers': 'Apni shob member ar trainer-ke message korte parben',
  'Success': 'Sofol',
  'You have been checked in!': 'Check in sofol hoyeche!',
  'Failed to check in': 'Check in byartho',
  'You have been checked out!': 'Check out sofol hoyeche!',
  'Failed to check out': 'Check out byartho',
  'Unknown': 'Ojana',
  'Present': 'Present',
  'Still checked in': 'Ekhono check in ache',
  'No attendance records for today': 'Ajker kono attendance record nei',
  'No attendance history': 'Attendance history nei',
  'Check Out': 'Check Out',
  'You are currently checked in': 'Apni ekhono checked in',
  'Tap to check in': 'Check in korte tap korun',
  'My History': 'Amar itihash',
  'Duration: {duration}': 'Shomoy: {duration}',
  'Today ({count})': 'Aj ({count})',
  'Delete messages': 'Message delete korun',
  'Delete {count} selected message(s)?': 'Nirbachito {count} message delete korben?',
  'Unable to delete selected messages': 'Nirbachito message delete korte parini',
  'Delete full chat': 'Puro chat delete korun',
  'This will permanently remove the entire conversation.': 'Eta puro conversation permanently delete korbe.',
  'Unable to delete full chat': 'Puro chat delete korte parini',
  'Send failed': 'Send byartho',
  'Unable to send message': 'Message pathano jayni',
  'Choose action': 'Action nirbachon korun',
  'User': 'User',
  'No messages yet. Start the conversation!': 'Ekhono kono message nei. Conversation shuru korun!',
  'Type a message...': 'Message likhun...',
  'Expired': 'Meyad shesh',
  'Start': 'Shuru',
  'Expires': 'Meyad shesh',
  'Visits': 'Visit',
  'Day Streak': 'Day streak',
  'Goals': 'Goal',
  'Account': 'Account',
  'Edit Profile': 'Edit profile',
  'QR Check-In': 'QR Check-In',
  'Body Metrics': 'Body metrics',
  'My Workouts': 'Amar workout',
  'My Diet Plan': 'Amar diet plan',
  'Preferences': 'Preference',
  'Light Mode': 'Light mode',
  'Dark Mode': 'Dark mode',
  'Support': 'Support',
  'Help & Support': 'Help and support',
  'Terms of Service': 'Terms of service',
  'Privacy Policy': 'Privacy policy',
  'Logout': 'Logout',
  'Built by Rounak Saha': 'Built by Rounak Saha',
  'Contributions: product architecture, frontend and backend engineering, deployment, and quality improvements.': 'Contributions: product architecture, frontend/backend engineering, deployment, and quality improvements.',
  'Are you sure you want to logout from your account?': 'Nishchit apni logout korte chan?',
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (stored === 'en' || stored === 'bn') {
          setLanguageState(stored);
        }
      } catch (error) {
        console.log('Failed to load language:', error);
      }
    })();
  }, []);

  const setLanguage = async (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch (error) {
      console.log('Failed to persist language:', error);
    }
  };

  const t = useMemo(() => {
    return (key: string, vars?: Record<string, string | number>) => {
      if (language !== 'bn') {
        return interpolate(key, vars);
      }
      const translated = BN_TRANSLATIONS[key] || key;
      return interpolate(translated, vars);
    };
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      languageLabel: LANGUAGE_LABELS[language],
    }),
    [language, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
