import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CalendarClock, MapPinned, NavigationArrow, Ticket } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getScheduleResults } from '../data/mockData';

export default function SearchScreen() {
  const params = useLocalSearchParams();
  const from = typeof params.from === 'string' ? params.from : '';
  const to = typeof params.to === 'string' ? params.to : '';
  const date = typeof params.date === 'string' ? params.date : '';

  const results = useMemo(() => getScheduleResults(from, to, date), [from, to, date]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={18} color="#F8FAFC" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text style={styles.routeText}>{from || 'Route'} → {to || 'Destination'}</Text>
          <Text style={styles.dateText}>{date || 'Travel date'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {results.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No buses found</Text>
            <Text style={styles.emptyBody}>Try another route or select another date to view departures.</Text>
          </View>
        ) : (
          results.map((route) => (
            <Pressable
              key={route.id}
              onPress={() => router.push({ pathname: '/booking', params: { ...route, seatMap: route.seatMap.join(',') } })}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.busText}>{route.bus}</Text>
                  <Text style={styles.routeTextSmall}>{route.from} → {route.to}</Text>
                </View>
                <Text style={styles.priceText}>{route.price} ETB</Text>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <CalendarClock size={14} color="#F59E0B" />
                  <Text style={styles.metaText}>{route.departure} - {route.arrival}</Text>
                </View>
                <View style={styles.metaItem}>
                  <MapPinned size={14} color="#F59E0B" />
                  <Text style={styles.metaText}>{route.duration}</Text>
                </View>
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.metaText}>{route.availableSeats} seats left</Text>
                <Text style={styles.selectText}>Select seats <NavigationArrow size={12} color="#F59E0B" /></Text>
              </View>
            </Pressable>
          ))
        )}
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
    paddingBottom: 12,
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
    fontSize: 14,
  },
  headerTextWrap: {
    alignItems: 'flex-end',
  },
  routeText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  routeTextSmall: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 4,
  },
  dateText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 3,
  },
  content: {
    padding: 18,
    gap: 14,
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  busText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  priceText: {
    color: '#F59E0B',
    fontSize: 18,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  metaText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 28,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyBody: {
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
});
