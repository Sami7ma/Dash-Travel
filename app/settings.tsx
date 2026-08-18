import { router } from 'expo-router';
import { ArrowLeft, Bell, CreditCard, ShieldCheck, SunMedium, WalletCards } from 'lucide-react-native';
import { Pressable, SafeAreaView, StyleSheet, Switch, Text, View } from 'react-native';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={18} color="#F8FAFC" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.labelWrap}>
            <Bell size={18} color="#F59E0B" />
            <Text style={styles.settingText}>Notifications</Text>
          </View>
          <Switch value={true} />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.labelWrap}>
            <SunMedium size={18} color="#F59E0B" />
            <Text style={styles.settingText}>Dark mode</Text>
          </View>
          <Switch value={true} />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.labelWrap}>
            <ShieldCheck size={18} color="#F59E0B" />
            <Text style={styles.settingText}>Security</Text>
          </View>
          <Switch value={true} />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.labelWrap}>
            <WalletCards size={18} color="#F59E0B" />
            <Text style={styles.settingText}>Payment methods</Text>
          </View>
          <Text style={styles.linkText}>Edit</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    color: '#F8FAFC',
    fontWeight: '600',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  card: {
    marginHorizontal: 18,
    padding: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingText: {
    color: '#F8FAFC',
    fontWeight: '600',
  },
  linkText: {
    color: '#F59E0B',
    fontWeight: '700',
  },
});
