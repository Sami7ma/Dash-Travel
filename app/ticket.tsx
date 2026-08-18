import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle2, MapPinned, Ticket as TicketIcon } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function TicketScreen() {
  const params = useLocalSearchParams();
  const from = typeof params.from === 'string' ? params.from : 'Addis Ababa';
  const to = typeof params.to === 'string' ? params.to : 'Dire Dawa';
  const date = typeof params.date === 'string' ? params.date : '2026-08-19';
  const departure = typeof params.departure === 'string' ? params.departure : '06:30';
  const arrival = typeof params.arrival === 'string' ? params.arrival : '10:15';
  const bus = typeof params.bus === 'string' ? params.bus : 'ET-102';
  const passenger = typeof params.passenger === 'string' ? params.passenger : 'Passenger';
  const seats = typeof params.seats === 'string' ? params.seats : '1A';
  const phone = typeof params.phone === 'string' ? params.phone : '09XXXXXXXX';
  const total = typeof params.total === 'string' ? params.total : '0';

  const qrValue = `Dash Travel|${from}|${to}|${date}|${seats}|${passenger}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.push('/')} style={styles.backButton}>
          <ArrowLeft size={18} color="#F8FAFC" />
          <Text style={styles.backText}>Home</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.ticketCard}>
          <Text style={styles.brand}>DASH TRAVEL</Text>
          <View style={styles.statusRow}>
            <CheckCircle2 size={16} color="#22C55E" />
            <Text style={styles.statusText}>Confirmed</Text>
          </View>

          <View style={styles.qrWrap}>
            <QRCode value={qrValue} size={160} backgroundColor="#F8FAFC" color="#0F172A" />
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Passenger</Text>
              <Text style={styles.value}>{passenger}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Route</Text>
              <Text style={styles.value}>{from} → {to}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{date}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Time</Text>
              <Text style={styles.value}>{departure} → {arrival}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Seat(s)</Text>
              <Text style={styles.value}>{seats}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Bus</Text>
              <Text style={styles.value}>{bus}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Total</Text>
              <Text style={styles.value}>{total} ETB</Text>
            </View>
          </View>

          <Pressable style={styles.primaryButton} onPress={() => router.push('/profile')}>
            <TicketIcon size={16} color="#0F172A" />
            <Text style={styles.primaryButtonText}>View bookings</Text>
          </Pressable>
        </View>
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
    padding: 18,
  },
  ticketCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
  },
  brand: {
    color: '#F59E0B',
    fontSize: 14,
    letterSpacing: 2,
    fontWeight: '800',
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 14,
  },
  statusText: {
    color: '#22C55E',
    fontWeight: '700',
  },
  qrWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    marginBottom: 18,
  },
  infoGrid: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    color: '#0F172A',
    fontWeight: '700',
  },
});
