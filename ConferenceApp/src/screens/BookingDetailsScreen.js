import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import BookingService from '../services/BookingService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateBookingStatus } from '../services/BookingService';

export default function BookingDetailScreen({ route, navigation }) {
  const { booking: initialBooking } = route.params; 
  const { currentUser } = useContext(AuthContext);
  
  const [booking, setBooking] = useState(initialBooking);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const idToFetch = initialBooking.id || initialBooking.booking_id;
        if (!idToFetch) return;

        const deepData = await BookingService.getBookingDetails(idToFetch);
        if (deepData) {
            setBooking(prevBooking => ({
                ...prevBooking, 
                ...deepData
            })); 
        }
      } catch (error) {
        console.log("Could not fetch deep booking details", error.message);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [initialBooking]);

  const isOrganizer = currentUser?.userid === booking.user_id;

  const executeCancellation = async () => {
    if (!cancelReason || cancelReason.trim().length < 3) {
      Alert.alert("Error", "Please provide a reason (min 3 characters).");
      return;
    }
 
    setIsCancelling(true);
    try {
      const idToCancel = booking.id || booking.booking_id;
      await updateBookingStatus({
          booking_id: idToCancel,
          status: "CANCELLED",
          cancellation_reason: cancelReason.trim()
      });

      setIsModalVisible(false);
      Alert.alert("Success", "Meeting cancelled.", [
        { text: "OK", onPress: () => navigation.goBack() } 
      ]);
    } catch (error) {
      Alert.alert("Error", error.message);
      setIsCancelling(false);
    }
  };
const isCancelled = booking.status?.toUpperCase() === 'CANCELLED';
const isPendingApproval = booking.status?.toUpperCase() === 'ACTIVE' && booking.final_approval?.toUpperCase() === 'PENDING';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollPadding}>
          
          {isCancelled ? (
              <View style={{ backgroundColor: '#FFEBEE', padding: 12, borderRadius: 8, marginBottom: 16, alignItems: 'center' }}>
                  <Text style={{ color: '#D32F2F', fontWeight: 'bold' }}>🚫 This meeting was cancelled.</Text>
              </View>
          ) : isPendingApproval ? (
              <View style={{ backgroundColor: '#FFF3E0', padding: 12, borderRadius: 8, marginBottom: 16, alignItems: 'center' }}>
                  <Text style={{ color: '#E65100', fontWeight: 'bold' }}>⏳ Pending Admin Approval</Text>
              </View>
          ) : (
              <View style={{ backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8, marginBottom: 16, alignItems: 'center' }}>
                  <Text style={{ color: '#2E7D32', fontWeight: 'bold' }}>✅ Booking Confirmed</Text>
              </View>
          )}

          {/* Headers */}
          <View style={styles.headerCard}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{booking.title}</Text>
              <View style={[styles.badge, isOrganizer ? styles.badgeOrg : styles.badgeGuest]}>
                <Text style={styles.badgeText}>{isOrganizer ? "Organizer" : "Guest"}</Text>
              </View>
            </View>
            <Text style={styles.metaText}>Status: {booking.status}</Text>
          </View>

          {/* Details */}
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Meeting Details</Text>
            <Text style={styles.infoText}>📍 Venue: {booking.office_name || `Office ${booking.office_id}`} - {booking.room_name || 'Room TBA'}</Text>
            <Text style={styles.infoText}>📅 Date: {new Date(booking.start_date).toLocaleDateString()}</Text>
            <Text style={styles.infoText}>🕒 Time: {booking.start_time} - {booking.end_time}</Text>
            {booking.frequency && booking.frequency !== 'NONE' && booking.frequency !== 'SINGLE' && (
              <Text style={styles.infoText}>🔄 Type: {booking.frequency}</Text>
            )}
          </View>

          {/* Guest List */}
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Participants ({booking.participants?.length || 0})</Text>
            
            {isLoadingDetails ? (
                <ActivityIndicator color="#3498db" style={{ marginTop: 10 }} />
            ) : booking.participants && booking.participants.length > 0 ? (
                booking.participants.map((p, index) => (
                    <Text key={index} style={styles.guestText}>
                        • {p.email || p.user_email || `User ID: ${p.user_id}`}
                    </Text>
                ))
            ) : (
                <Text style={[styles.guestText, { fontStyle: 'italic', color: '#999' }]}>No participants listed.</Text>
            )}
          </View>

        </ScrollView>

        {isOrganizer && booking.status !== 'CANCELLED' && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelInitButton} onPress={() => setIsModalVisible(true)}>
              <Text style={styles.cancelInitButtonText}>Cancel this Meeting</Text>
            </TouchableOpacity>
          </View>
        )}

        <Modal visible={isModalVisible} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Cancel Meeting</Text>
              <Text style={styles.modalSubtitle}>Please provide a reason for cancellation:</Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Scheduling conflict..."
                value={cancelReason}
                onChangeText={setCancelReason}
                multiline={true}
                numberOfLines={3}
              />
              
              <View style={styles.modalButtonGroup}>
                <TouchableOpacity 
                  style={styles.modalBackButton} 
                  onPress={() => { setIsModalVisible(false); setCancelReason(''); }} 
                  disabled={isCancelling}
                >
                  <Text style={styles.modalBackButtonText}>Go Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={executeCancellation}
                  disabled={isCancelling}
                >
                  {isCancelling ? <ActivityIndicator color="#FFF"/> : <Text style={styles.modalConfirmButtonText}>Confirm Cancel</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scrollPadding: { padding: 16 },
  headerCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, marginBottom: 16, elevation: 2 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50', flex: 1 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  badgeOrg: { backgroundColor: '#8e44ad' },
  badgeGuest: { backgroundColor: '#3498db' },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  metaText: { fontSize: 14, color: '#7f8c8d' },
  
  infoCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, marginBottom: 16, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#34495e', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 6 },
  infoText: { fontSize: 16, color: '#2c3e50', marginBottom: 8 },
  guestText: { fontSize: 15, color: '#555', marginBottom: 4 },
  
  footer: { padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#eee' },
  cancelInitButton: { backgroundColor: '#e74c3c', paddingVertical: 15, borderRadius: 8, alignItems: 'center' },
  cancelInitButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 12, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  modalInput: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#F9F9F9', textAlignVertical: 'top', marginBottom: 20 },
  modalButtonGroup: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalBackButton: { paddingVertical: 10, paddingHorizontal: 16, marginRight: 10 },
  modalBackButtonText: { color: '#666', fontSize: 16, fontWeight: '600' },
  modalConfirmButton: { backgroundColor: '#e74c3c', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  disabledBtn: { backgroundColor: '#f1948a' },
  modalConfirmButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});