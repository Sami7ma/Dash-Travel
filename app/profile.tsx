import { router } from 'expo-router';
import { ArrowLeft, Bell, CreditCard, Settings, Ticket } from 'lucide-react-native';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { bookingRecords } from '../data/mockData';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.push('/')} style={styles.backButton}>
          <ArrowLeft size={18} color="#F8FAFC" />
          <Text style={styles.backText}>Home</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <Text style={styles.name}>Samuel Mifta</Text>
          <Text style={styles.subText}>+251 9 12 34 56 78</Text>
        </View>

        <View style={styles.rowCards}>
          <Pressable style={styles.actionCard} onPress={() => router.push('/profile')}>
            <Ticket size={18} color="#F59E0B" />
            <Text style={styles.actionText}>Bookings</Text>
          </Pressable>
          <Pressable style={styles.actionCard} onPress={() => router.push('/settings')}>
            <Settings size={18} color="#F59E0B" />
            <Text style={styles.actionText}>Settings</Text>
          </Pressable>
          <Pressable style={styles.actionCard} onPress={() => router.push('/auth/login')}>
            <CreditCard size={18} color="#F59E0B" />
            <Text style={styles.actionText}>Admin</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Recent tickets</Text>
        {bookingRecords.map((booking) => (
          <View key={booking.id} style={styles.bookingCard}>
            <View style={styles.topRow}>
              <Text style={styles.bookingId}>{booking.id}</Text>
              <Text style={styles.status}>{booking.status}</Text>
            </View>
            <Text style={styles.route}>{booking.route}</Text>
            <Text style={styles.detail}>{booking.date} • {booking.time}</Text>
            <Text style={styles.detail}>Seats: {booking.seats.join(', ')}</Text>
            <Text style={styles.amount}>{booking.amount} ETB</Text>
          </View>
        ))}
      </ScrollView>
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
    paddingBottom: 8,
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
  content: {
    paddingHorizontal: 18,
  },
  profileCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    marginBottom: 16,
  },
  name: {
    color: '#F8FAFC',
    fontSize: 26,
    fontWeight: '800',
  },
  subText: {
    color: '#94A3B8',
    marginTop: 6,
  },
  rowCards: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  bookingCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  bookingId: {
    color: '#F59E0B',
    fontWeight: '700',
  },
  status: {
    color: '#22C55E',
    fontWeight: '700',
    fontSize: 12,
  },
  route: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  detail: {
    color: '#94A3B8',
    marginBottom: 2,
    fontSize: 12,
  },
  amount: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },
});
