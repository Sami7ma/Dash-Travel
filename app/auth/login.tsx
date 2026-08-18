import { router } from 'expo-router';
import { ArrowLeft, LockKeyhole, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function AdminLoginScreen() {
  const [employeeNumber, setEmployeeNumber] = useState('SUPEMP001');
  const [password, setPassword] = useState('DashTravel@2026');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.push('/')} style={styles.backButton}>
          <ArrowLeft size={18} color="#F8FAFC" />
          <Text style={styles.backText}>Home</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Staff Login</Text>
        <Text style={styles.subtitle}>Dash Travel operations portal</Text>

        <View style={styles.inputWrap}>
          <Text style={styles.label}><UserRound size={14} color="#F59E0B" /> Employee number</Text>
          <TextInput style={styles.input} value={employeeNumber} onChangeText={setEmployeeNumber} placeholder="SUPEMP001" placeholderTextColor="#94A3B8" />
        </View>

        <View style={styles.inputWrap}>
          <Text style={styles.label}><LockKeyhole size={14} color="#F59E0B" /> Password</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" placeholderTextColor="#94A3B8" />
        </View>

        <Pressable style={styles.primaryButton} onPress={() => router.push('/profile')}>
          <Text style={styles.primaryButtonText}>Sign in</Text>
        </Pressable>
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
  card: {
    flex: 1,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94A3B8',
    marginBottom: 18,
  },
  inputWrap: {
    marginBottom: 16,
  },
  label: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
  },
  primaryButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 16,
  },
});
