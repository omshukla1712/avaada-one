import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function BookingCard({ booking, onCardPress, currentUserEmail }) {
    if (!booking) return null;

    const getStatusStyle = (status) => {
        switch (status?.toUpperCase()) {
            case 'ACTIVE':
            case 'APPROVED': return styles.badgeApproved;
            case 'PENDING': return styles.badgePending;
            case 'CANCELLED': return styles.badgeCancelled;
            default: return styles.badgeDefault;
        }
    };

    const formattedDate = new Date(booking.start_date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    
    const start24 = booking.start_time ? booking.start_time.substring(0, 5) : '';
    const end24 = booking.end_time ? booking.end_time.substring(0, 5) : '';

    const roomName = booking.conference_rooms?.[0]?.room_name || booking.room_name || 'Room TBA';
    const officeName = booking.office_name || `Office ${booking.office_id || 'TBA'}`;

   return (
    <TouchableOpacity 
      style={[
        styles.card, 
        booking.status?.toUpperCase() === 'CANCELLED' && { opacity: 0.5 } 
      ]} 
      onPress={onCardPress} 
      disabled={booking.status?.toUpperCase() === 'CANCELLED'} 
      activeOpacity={0.7} 
    >
      <View style={styles.headerRow}>
      <Text style={styles.title} numberOfLines={1}>
        {booking.title}
      </Text>

      <View style={[styles.badge, getStatusStyle(booking.status)]}>
        <Text style={styles.badgeText}>{booking.status}</Text>
      </View>
    </View>

    <Text style={styles.roomName}>📍 {officeName} • {roomName}</Text>

    <Text style={styles.timeText}>
      {formattedDate} • {start24} - {end24}
    </Text>

    {booking.frequency && booking.frequency !== 'NONE' && booking.frequency !== 'SINGLE' && (
      <Text style={styles.metaText}>
        🔄 {booking.frequency.charAt(0).toUpperCase() + booking.frequency.slice(1).toLowerCase()} Recurrence
      </Text>
    )}
    </TouchableOpacity>
);}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  badgeApproved: { backgroundColor: '#4CAF50' }, 
  badgePending: { backgroundColor: '#FF9800' },  
  badgeCancelled: { backgroundColor: '#F44336' },
  badgeDefault: { backgroundColor: '#9E9E9E' },   
  roomName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#2196F3', 
    marginTop: 4,
    fontStyle: 'italic',
  },
});