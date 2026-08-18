import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPinned, ShieldCheck, Ticket, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { getScheduleById } from '../data/mockData';

const seatLayout = ['1A', '1B', '1C', '1D', '2A', '2B', '2C', '2D', '3A', '3B', '3C', '3D', '4A', '4B', '4C', '4D'];

export default function BookingScreen() {
  const params = useLocalSearchParams();
  const schedule = useMemo(() => getScheduleById((params.id as string | undefined) ?? 'route-1'), [params.id]);

  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const totalPrice = selectedSeats.length * schedule.price;

  const toggleSeat = (seat: string) => {
    setError('');
    const alreadySelected = selectedSeats.includes(seat);

    if (alreadySelected) {
      setSelectedSeats((current) => current.filter((item) => item !== seat));
      return;
    }

    if (selectedSeats.length >= 4) {
      setError('Maximum 4 seats per booking in this demo');
      return;
    }

    setSelectedSeats((current) => [...current, seat]);
  };

  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      setError('Please choose at least one seat');
      return;
    }

    if (!name.trim() || !phone.trim()) {
      setError('Please provide passenger name and phone number');
      return;
    }

    setError('');
    router.push({
      pathname: '/ticket',
      params: {
        from: schedule.from,
        to: schedule.to,
        date: schedule.date,
        departure: schedule.departure,
        arrival: schedule.arrival,
        bus: schedule.bus,
        seats: selectedSeats.join(','),
        passenger: name,
        phone,
        total: String(totalPrice),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={18} color="#F8FAFC" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{schedule.from} → {schedule.to}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Departure</Text>
            <Text style={styles.summaryValue}>{schedule.departure}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Arrival</Text>
            <Text style={styles.summaryValue}>{schedule.arrival}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Bus</Text>
            <Text style={styles.summaryValue}>{schedule.bus}</Text>
          </View>
        </View>

        <View style={styles.seatHeader}>
          <View style={styles.seatLegendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.legendAvailable]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.legendSelected]} />
              <Text style={styles.legendText}>Selected</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.legendSold]} />
              <Text style={styles.legendText}>Booked</Text>
            </View>
          </View>
          <Text style={styles.selectionText}>{selectedSeats.length} seat(s)</Text>
        </View>

        <View style={styles.seatGrid}>
          {seatLayout.map((seat) => {
            const isSelected = selectedSeats.includes(seat);
            const isBooked = seat === '1C' || seat === '2D' || seat === '3A';

            return (
              <Pressable
                key={seat}
                onPress={() => !isBooked && toggleSeat(seat)}
                style={[
                  styles.seatButton,
                  isSelected && styles.seatSelected,
                  isBooked && styles.seatBooked,
                ]}
              >
                <Text style={[styles.seatLabel, isBooked && styles.seatLabelBooked]}>{seat}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.formCard}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.inputWrap}>
            <Text style={styles.fieldLabel}><Users size={14} color="#F59E0B" /> Passenger name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor="#94A3B8" />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.fieldLabel}><MapPinned size={14} color="#F59E0B" /> Phone</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="09XXXXXXXX" keyboardType="phone-pad" placeholderTextColor="#94A3B8" />
          </View>

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{totalPrice} ETB</Text>
          </View>

          <Pressable style={styles.primaryButton} onPress={handleContinue}>
            <ShieldCheck size={16} color="#0F172A" />
            <Text style={styles.primaryButtonText}>Continue to ticket</Text>
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
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
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
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    padding: 18,
    gap: 16,
  },
  summaryCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },
  summaryValue: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  seatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  seatLegendRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  legendAvailable: {
    backgroundColor: '#1E293B',
  },
  legendSelected: {
    backgroundColor: '#F59E0B',
  },
  legendSold: {
    backgroundColor: '#374151',
  },
  legendText: {
    color: '#E2E8F0',
    fontSize: 11,
  },
  selectionText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
  },
  seatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
  },
  seatButton: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatSelected: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  seatBooked: {
    backgroundColor: '#374151',
    borderColor: 'rgba(148,163,184,0.3)',
  },
  seatLabel: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 12,
  },
  seatLabelBooked: {
    color: '#CBD5E1',
  },
  formCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
  },
  inputWrap: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  totalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingTop: 8,
  },
  totalLabel: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  totalAmount: {
    color: '#F59E0B',
    fontSize: 22,
    fontWeight: '800',
  },
  primaryButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 16,
  },
  error: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.3)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    color: '#FCA5A5',
    marginBottom: 12,
    fontSize: 12,
  },
});
