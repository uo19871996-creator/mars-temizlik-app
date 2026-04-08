import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

interface Appointment {
  id: string;
  service_name: string;
  date: string;
  time_slot: string;
  status: string;
  service_price: number;
  address: string;
  notes?: string;
  user_info?: {
    full_name: string;
    phone: string;
    email: string;
  };
}

export default function AppointmentsScreen() {
  const { user, token } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(response.data);
    } catch (error) {
      console.log('Error fetching appointments:', error);
      Alert.alert('Hata', 'Randevular yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const handleCancel = (appointmentId: string) => {
    Alert.alert(
      'Randevu İptali',
      'Bu randevuyu iptal etmek istediğinizden emin misiniz?',
      [
        { text: 'Hayır', style: 'cancel' },
        {
          text: 'Evet, İptal Et',
          style: 'destructive',
          onPress: () => cancelAppointment(appointmentId),
        },
      ]
    );
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/appointments/${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('Başarılı', 'Randevu iptal edildi');
      fetchAppointments();
    } catch (error) {
      Alert.alert('Hata', 'Randevu iptal edilirken bir hata oluştu');
    }
  };

  const updateStatus = async (appointmentId: string, status: string) => {
    try {
      await axios.patch(
        `${BACKEND_URL}/api/appointments/${appointmentId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Başarılı', 'Randevu durumu güncellendi');
      fetchAppointments();
    } catch (error) {
      Alert.alert('Hata', 'Durum güncellenirken bir hata oluştu');
    }
  };

  const getFilteredAppointments = () => {
    if (filter === 'upcoming') {
      return appointments.filter(
        (apt) => apt.status === 'pending' || apt.status === 'confirmed' || apt.status === 'in_progress'
      );
    } else if (filter === 'past') {
      return appointments.filter(
        (apt) => apt.status === 'completed' || apt.status === 'cancelled'
      );
    }
    return appointments;
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

  const filteredAppointments = getFilteredAppointments();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Randevularım</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Tümü
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'upcoming' && styles.filterTabActive]}
          onPress={() => setFilter('upcoming')}
        >
          <Text style={[styles.filterText, filter === 'upcoming' && styles.filterTextActive]}>
            Yaklaşan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'past' && styles.filterTabActive]}
          onPress={() => setFilter('past')}
        >
          <Text style={[styles.filterText, filter === 'past' && styles.filterTextActive]}>
            Geçmiş
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredAppointments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>Randevu bulunamadı</Text>
            </View>
          ) : (
            filteredAppointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.cardHeader}>
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

                {/* Admin: Show customer info */}
                {user?.role === 'admin' && appointment.user_info && (
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerLabel}>Müşteri Bilgileri:</Text>
                    <Text style={styles.customerText}>{appointment.user_info.full_name}</Text>
                    <Text style={styles.customerText}>{appointment.user_info.phone}</Text>
                  </View>
                )}

                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                    <Text style={styles.detailText}>{appointment.date}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={18} color="#6B7280" />
                    <Text style={styles.detailText}>{appointment.time_slot}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={18} color="#6B7280" />
                    <Text style={styles.detailText}>{appointment.address}</Text>
                  </View>
                  {appointment.notes && (
                    <View style={styles.detailRow}>
                      <Ionicons name="document-text-outline" size={18} color="#6B7280" />
                      <Text style={styles.detailText}>{appointment.notes}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.price}>{appointment.service_price} ₺</Text>
                  <View style={styles.actions}>
                    {user?.role === 'admin' && appointment.status === 'pending' && (
                      <>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.confirmButton]}
                          onPress={() => updateStatus(appointment.id, 'confirmed')}
                        >
                          <Text style={styles.actionButtonText}>Onayla</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.cancelButton]}
                          onPress={() => handleCancel(appointment.id)}
                        >
                          <Text style={[styles.actionButtonText, { color: '#DC2626' }]}>
                            Reddet
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {user?.role === 'admin' && appointment.status === 'confirmed' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.confirmButton]}
                        onPress={() => updateStatus(appointment.id, 'in_progress')}
                      >
                        <Text style={styles.actionButtonText}>Başlat</Text>
                      </TouchableOpacity>
                    )}
                    {user?.role === 'admin' && appointment.status === 'in_progress' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.confirmButton]}
                        onPress={() => updateStatus(appointment.id, 'completed')}
                      >
                        <Text style={styles.actionButtonText}>Tamamla</Text>
                      </TouchableOpacity>
                    )}
                    {user?.role === 'customer' &&
                      appointment.status !== 'cancelled' &&
                      appointment.status !== 'completed' && (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.cancelButton]}
                          onPress={() => handleCancel(appointment.id)}
                        >
                          <Text style={[styles.actionButtonText, { color: '#DC2626' }]}>
                            İptal Et
                          </Text>
                        </TouchableOpacity>
                      )}
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#DC2626',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
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
  customerInfo: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  customerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  customerText: {
    fontSize: 14,
    color: '#111827',
  },
  detailsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  confirmButton: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderColor: '#FEE2E2',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});