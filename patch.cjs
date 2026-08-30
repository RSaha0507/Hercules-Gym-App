const fs = require('fs');
const file = 'frontend/app/(tabs)/profile.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
  "import { formatDateDDMMYYYY, toSystemDate } from '../../src/utils/time';",
  "import { formatDateDDMMYYYY, toSystemDate } from '../../src/utils/time';\nimport AsyncStorage from '@react-native-async-storage/async-storage';\nimport { Skeleton } from '../../src/components/Skeleton';"
);

data = data.replace(
  "const [memberProfile, setMemberProfile] = useState<any>(null);",
  "const [memberProfile, setMemberProfile] = useState<any>(null);\n  const [isLoading, setIsLoading] = useState(true);"
);

const oldLoad = `  const loadProfile = useCallback(async () => {
    if (user?.role === 'member' && user?.id) {
      try {
        const [data, paymentSummary] = await Promise.all([
          api.getMember(user.id),
          api.getMyPaymentSummary(),
        ]);
        setMemberProfile(data.profile);
        setMemberAchievements(data.user?.achievements || []);
        setMembershipDue(paymentSummary.membership_due || null);
        setMembershipHistory(paymentSummary.membership_history || []);
        setShopHistory(paymentSummary.shop_history || []);
      } catch (error) {
        console.log('Error loading profile:', error);
      }
      return;
    }

    if (user?.role === 'trainer') {
      setMemberAchievements(user?.achievements || []);
    }
  }, [user?.achievements, user?.id, user?.role]);`;

const newLoad = `  const loadProfile = useCallback(async () => {
    if (user?.role === 'member' && user?.id) {
      setIsLoading(true);
      try {
        // Offline-First: Check cache first
        const cachedProfile = await AsyncStorage.getItem('member_profile_cache_' + user.id);
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          setMemberProfile(parsed.profile);
          setMemberAchievements(parsed.achievements || []);
          setIsLoading(false); // Render cache immediately
        }

        const [data, paymentSummary] = await Promise.all([
          api.getMember(user.id),
          api.getMyPaymentSummary(),
        ]);
        
        // Update state with fresh data
        setMemberProfile(data.profile);
        setMemberAchievements(data.user?.achievements || []);
        setMembershipDue(paymentSummary.membership_due || null);
        setMembershipHistory(paymentSummary.membership_history || []);
        setShopHistory(paymentSummary.shop_history || []);
        
        // Save to cache for offline use
        await AsyncStorage.setItem('member_profile_cache_' + user.id, JSON.stringify({
          profile: data.profile,
          achievements: data.user?.achievements
        }));
      } catch (error) {
        console.log('Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (user?.role === 'trainer') {
      setMemberAchievements(user?.achievements || []);
    }
  }, [user?.achievements, user?.id, user?.role]);`;

data = data.replace(oldLoad, newLoad);

// Replace Membership Status for Members block with loading skeleton if isLoading
const oldMembership = `{user?.role === 'member' && memberProfile?.membership && (`;
const newMembership = `{user?.role === 'member' && isLoading && !memberProfile && (
          <View style={[styles.membershipCard, { backgroundColor: theme.card, padding: 16 }]}>
            <Skeleton width="40%" height={20} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={15} style={{ marginBottom: 8 }} />
            <Skeleton width="100%" height={15} />
          </View>
        )}
        {user?.role === 'member' && !isLoading && memberProfile?.membership && (`;

data = data.replace(oldMembership, newMembership);

// Same for stat cards
const oldStats = `{(user?.role === 'member' || user?.role === 'trainer') && (
          <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
            <View style={styles.sectionCardHeader}>
              <Ionicons name="trophy-outline" size={18} color={theme.primary} />`;
              
const newStats = `{(user?.role === 'member' || user?.role === 'trainer') && isLoading && !memberProfile && (
          <View style={[styles.sectionCard, { backgroundColor: theme.card, padding: 16 }]}>
            <Skeleton width="30%" height={20} style={{ marginBottom: 16 }} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
               <Skeleton width={60} height={60} borderRadius={30} />
               <Skeleton width={60} height={60} borderRadius={30} />
            </View>
          </View>
        )}
        {(user?.role === 'member' || user?.role === 'trainer') && !isLoading && (
          <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
            <View style={styles.sectionCardHeader}>
              <Ionicons name="trophy-outline" size={18} color={theme.primary} />`;
              
data = data.replace(oldStats, newStats);

fs.writeFileSync(file, data);
