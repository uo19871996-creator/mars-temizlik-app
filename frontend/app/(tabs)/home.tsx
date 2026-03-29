import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useRouter } from 'expo-router';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

interface Appointment {
  id: string;
  service_name: string;
  date: string;
  time_slot: string;
  status: string;
  service_price: number;
  address: string;
}

export default function HomeScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filter upcoming appointments
      const upcoming = response.data.filter(
        (apt: Appointment) => apt.status === 'pending' || apt.status === 'confirmed'
      );
      setAppointments(upcoming.slice(0, 3));
    } catch (error) {
      console.log('Error fetching appointments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'confirmed':
        return '#10B981';
      case 'in_progress':
        return '#3B82F6';
      case 'completed':
        return '#6B7280';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#9CA3AF';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'confirmed':
        return 'Onaylandı';
      case 'in_progress':
        return 'Devam Ediyor';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Merhaba,</Text>
            <Text style={styles.userName}>{user?.full_name}</Text>
          </View>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🚀</Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#DC2626' }]}>
            <Text style={styles.statNumber}>{appointments.length}</Text>
            <Text style={styles.statLabel}>Yaklaşan Randevu</Text>
          </View>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: '#EA580C' }]}
            onPress={() => router.push('/(tabs)/book')}
          >
            <Ionicons name="add-circle-outline" size={32} color="#fff" />
            <Text style={styles.statLabel}>Yeni Randevu</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Yaklaşan Randevular</Text>
            {appointments.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/appointments')}>
                <Text style={styles.seeAll}>Tümünü Gör</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#DC2626" />
            </View>
          ) : appointments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>Henüz randevunuz yok</Text>
              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => router.push('/(tabs)/book')}
              >
                <Text style={styles.bookButtonText}>Randevu Oluştur</Text>
              </TouchableOpacity>
            </View>
          ) : (
            appointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentHeader}>
                  <Text style={styles.serviceName}>{appointment.service_name}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(appointment.status) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(appointment.status) },
                      ]}
                    >
                      {getStatusText(appointment.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.appointmentDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{appointment.date}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{appointment.time_slot}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText} numberOfLines={1}>
                      {appointment.address}
                    </Text>
                  </View>
                </View>
                <View style={styles.appointmentFooter}>
                  <Text style={styles.price}>{appointment.service_price} ₺</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Services Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hizmetlerimiz</Text>
          <View style={styles.servicesGrid}>
            <View style={styles.serviceItem}>
              <View style={[styles.serviceIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="home" size={32} color="#3B82F6" />
              </View>
              <Text style={styles.serviceText}>Ev Temizliği</Text>
            </View>
            <View style={styles.serviceItem}>
              <View style={[styles.serviceIcon, { backgroundColor: '#FCE7F3' }]}>
                <Ionicons name="briefcase" size={32} color="#EC4899" />
              </View>
              <Text style={styles.serviceText}>Ofis Temizliği</Text>
            </View>
            <View style={styles.serviceItem}>
              <View style={[styles.serviceIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="sparkles" size={32} color="#F59E0B" />
              </View>
              <Text style={styles.serviceText}>Derin Temizlik</Text>
            </View>
            <View style={styles.serviceItem}>
              <View style={[styles.serviceIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="square" size={32} color="#10B981" />
              </View>
              <Text style={styles.serviceText}>Cam Temizliği</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    padding: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  seeAll: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
  },
  bookButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  appointmentFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  serviceItem: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  serviceIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});