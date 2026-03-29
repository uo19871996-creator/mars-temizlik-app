import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  icon: string;
}

const TIME_SLOTS = [
  '09:00-12:00',
  '12:00-15:00',
  '15:00-18:00',
  '18:00-21:00',
];

export default function BookScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/services`);
      setServices(response.data);
    } catch (error) {
      console.log('Error fetching services:', error);
      Alert.alert('Hata', 'Hizmetler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedService) {
      Alert.alert('Hata', 'Lütfen bir hizmet seçin');
      return;
    }
    if (!selectedDate) {
      Alert.alert('Hata', 'Lütfen tarih girin');
      return;
    }
    if (!selectedTimeSlot) {
      Alert.alert('Hata', 'Lütfen saat seçin');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Hata', 'Lütfen adres girin');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/appointments`,
        {
          service_id: selectedService.id,
          date: selectedDate,
          time_slot: selectedTimeSlot,
          address: address.trim(),
          notes: notes.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Başarılı!', 'Randevunuz oluşturuldu', [
        {
          text: 'Tamam',
          onPress: () => {
            // Reset form
            setSelectedService(null);
            setSelectedDate('');
            setSelectedTimeSlot('');
            setAddress('');
            setNotes('');
            // Navigate to appointments
            router.push('/(tabs)/appointments');
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.detail || 'Randevu oluşturulurken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const getIconName = (icon: string) => {
    const iconMap: { [key: string]: any } = {
      home: 'home',
      briefcase: 'briefcase',
      sparkles: 'sparkles',
      square: 'square',
    };
    return iconMap[icon] || 'help-circle';
  };

  const getIconColor = (index: number) => {
    const colors = ['#3B82F6', '#EC4899', '#F59E0B', '#10B981'];
    return colors[index % colors.length];
  };

  const getIconBgColor = (index: number) => {
    const bgColors = ['#DBEAFE', '#FCE7F3', '#FEF3C7', '#D1FAE5'];
    return bgColors[index % bgColors.length];
  };

  // Generate next 30 days dates
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dates.push(dateStr);
    }
    return dates;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Yeni Randevu</Text>
        </View>

        <ScrollView style={styles.scrollView}>
          {/* Service Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hizmet Seçin</Text>
            <View style={styles.servicesGrid}>
              {services.map((service, index) => (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.serviceCard,
                    selectedService?.id === service.id && styles.serviceCardSelected,
                  ]}
                  onPress={() => setSelectedService(service)}
                >
                  <View
                    style={[
                      styles.serviceIcon,
                      { backgroundColor: getIconBgColor(index) },
                    ]}
                  >
                    <Ionicons
                      name={getIconName(service.icon)}
                      size={28}
                      color={getIconColor(index)}
                    />
                  </View>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceDescription}>{service.description}</Text>
                  <View style={styles.serviceFooter}>
                    <Text style={styles.serviceDuration}>{service.duration_minutes} dk</Text>
                    <Text style={styles.servicePrice}>{service.price} ₺</Text>
                  </View>
                  {selectedService?.id === service.id && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tarih Seçin</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD (örn: 2025-07-15)"
              value={selectedDate}
              onChangeText={setSelectedDate}
            />
          </View>

          {/* Time Slot Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Saat Seçin</Text>
            <View style={styles.timeSlotsContainer}>
              {TIME_SLOTS.map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.timeSlot,
                    selectedTimeSlot === slot && styles.timeSlotSelected,
                  ]}
                  onPress={() => setSelectedTimeSlot(slot)}
                >
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={selectedTimeSlot === slot ? '#fff' : '#6B7280'}
                  />
                  <Text
                    style={[
                      styles.timeSlotText,
                      selectedTimeSlot === slot && styles.timeSlotTextSelected,
                    ]}
                  >
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Address */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Adres</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Hizmetin gerçekleştirileceği adresi girin"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notlar (Opsiyonel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ek bilgi veya özel talepleriniz..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Summary */}
          {selectedService && (
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Randevu Özeti</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Hizmet:</Text>
                <Text style={styles.summaryValue}>{selectedService.name}</Text>
              </View>
              {selectedDate && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tarih:</Text>
                  <Text style={styles.summaryValue}>{selectedDate}</Text>
                </View>
              )}
              {selectedTimeSlot && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Saat:</Text>
                  <Text style={styles.summaryValue}>{selectedTimeSlot}</Text>
                </View>
              )}
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.summaryTotalLabel}>Toplam:</Text>
                <Text style={styles.summaryTotalValue}>{selectedService.price} ₺</Text>
              </View>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Randevu Oluştur</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  servicesGrid: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  serviceCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceDuration: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  checkmark: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  timeSlotSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  timeSlotText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  timeSlotTextSelected: {
    color: '#fff',
  },
  summary: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  summaryTotal: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryTotalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  submitButton: {
    margin: 16,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});