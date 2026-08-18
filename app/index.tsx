import { router } from 'expo-router';
import { CalendarDays, MapPinned, NavigationArrow, PackageSearch, Ticket } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { cities } from '../data/mockData';

export default function HomeScreen() {
  const [from, setFrom] = useState('Addis Ababa');
  const [to, setTo] = useState('Dire Dawa');
  const [date, setDate] = useState('2026-08-19');
  const [error, setError] = useState('');

  const cityOptions = useMemo(() => cities.map((city) => city.name), []);

  const handleSearch = () => {
    if (!from || !to || !date) {
      setError('Please fill all search fields');
      return;
    }

    if (from === to) {
      setError('Origin and destination cannot be the same');
      return;
    }

    setError('');
    router.push({ pathname: '/search', params: { from, to, date } });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80' }}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.brandWrap}>
            <Text style={styles.brand}>Dash Travel</Text>
          </View>

          <Text style={styles.heroTitle}>{'Travel Ethiopia\nYour Way'}</Text>
          <Text style={styles.subtitle}>Book bus tickets across Ethiopia with live seat availability and secure payment.</Text>

          <View style={styles.card}>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}><MapPinned size={14} color="#F59E0B" /> From</Text>
                <TextInput
                  style={styles.input}
                  value={from}
                  onChangeText={setFrom}
                  placeholder="City"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.fieldHalf}>
                <Text style={styles.label}><NavigationArrow size={14} color="#F59E0B" /> To</Text>
                <TextInput
                  style={styles.input}
                  value={to}
                  onChangeText={setTo}
                  placeholder="Destination"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.fieldColumn}>
              <Text style={styles.label}><CalendarDays size={14} color="#F59E0B" /> Travel date</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <Pressable style={styles.primaryButton} onPress={handleSearch}>
              <Text style={styles.primaryButtonText}>Search Buses</Text>
            </Pressable>
          </View>

          <Pressable style={styles.secondaryButton} onPress={() => router.push('/profile')}>
            <Ticket size={16} color="#F8FAFC" />
            <Text style={styles.secondaryButtonText}>My Bookings</Text>
          </Pressable>

          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <PackageSearch size={18} color="#F59E0B" />
              <Text style={styles.statText}>Live seat updates</Text>
            </View>
            <View style={styles.statItem}>
              <MapPinned size={18} color="#22C55E" />
              <Text style={styles.statText}>Popular routes</Text>
            </View>
          </View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  background: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 32,
  },
  brandWrap: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  brand: {
    color: '#F59E0B',
    fontSize: 13,
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  heroTitle: {
    color: '#F8FAFC',
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 360,
    marginBottom: 28,
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    padding: 18,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  fieldHalf: {
    flex: 1,
  },
  fieldColumn: {
    marginBottom: 18,
  },
  label: {
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    paddingVertical: 14,
    marginTop: 18,
  },
  secondaryButtonText: {
    color: '#F8FAFC',
    fontWeight: '600',
    fontSize: 15,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
  },
  statText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  error: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.3)',
    borderWidth: 1,
    color: '#FCA5A5',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    fontSize: 13,
  },
});
