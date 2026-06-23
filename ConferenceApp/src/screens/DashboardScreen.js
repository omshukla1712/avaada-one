import React, { useState, useEffect,useContext, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { fetchUserBookings } from '../services/BookingService';
import Ionicons from 'react-native-vector-icons/Ionicons'; 

const SkeletonCard = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonHeaderRow}>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonBadge} />
    </View>
    <View style={styles.skeletonTextRow} />
    <View style={styles.skeletonTextRowShort} />
  </View>
);

export default function DashboardScreen({navigation}) {
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true); 
  const [isRefreshing, setIsRefreshing] = useState(false); 
  const [error,setError]=useState(null);
  const { currentUser } = useContext(AuthContext);



  const loadBookings = async () => {
    try {
      setError(null);
      const response = await fetchUserBookings();
      
      const meetingsArray = response?.body?.data?.rows || response?.data?.rows || response?.data || response || [];

      if (!Array.isArray(meetingsArray)) {
          console.error("Data extraction failed. Received:", meetingsArray);
          throw new Error("Invalid data format received from server.");
      }

      const now = new Date();
      
      const upcomingMeetings = meetingsArray.filter(booking => {
        if (booking.status === 'CANCELLED') return false;

        const dateStr = booking.start_date.split('T')[0];
        const endTimeStr = (booking.end_time || booking.start_time).substring(0, 5);
        const meetingEnd = new Date(`${dateStr}T${endTimeStr}:00`);
        
        return meetingEnd > now;
      });
      
      setUpcomingCount(upcomingMeetings.length);
    } catch (error) {
      Alert.alert("Failed to fetch bookings:", error.message || 'An unknown error occurred');
      setError(error.message || "Failed to fetch bookings.");
    } finally {
      setIsInitialLoading(false); 
      setIsRefreshing(false);
    }
  };
  useEffect(() => {
      loadBookings();
  }, []);

const handleRefresh = () => {
    setIsRefreshing(true); 
    loadBookings();     
  };
      
  if (isInitialLoading) {
    return (
      <View style={styles.container}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

return (
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#2196F3']} 
            tintColor="#2196F3"  
          />
        }
      >
       <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>
                Welcome Back, <Text style={styles.nameText}>{currentUser?.full_name|| 'User'}</Text>
            </Text>
        </View>

     <View style={styles.quickActionsCard}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <View style={styles.actionGrid}>
            {/* 1. Book Room Card */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
               navigation.navigate('RoomSelection');
              }}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="business" size={28} color="#2196F3" />
              </View>
              <Text style={styles.actionText}>Book a Room</Text>
            </TouchableOpacity>

              {/* 2. My Meetings Card */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('MyMeetingsHub')}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="calendar" size={28} color="#9C27B0" />
            
                {upcomingCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{upcomingCount}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.actionText}>My Meetings</Text>
            </TouchableOpacity>

                {/* 3. Global Schedule Card */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('CampusSchedule')}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="time" size={28} color="#4CAF50" />
              </View>
              <Text style={styles.actionText}>Schedule</Text>
            </TouchableOpacity>

            {/* 4. Support Directory Card */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('AdminDirectory')}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="people-outline" size={28} color="#FF9800" />
              </View>
              <Text style={styles.actionText}>Admin Directory</Text>
            </TouchableOpacity>

          </View>
        </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf5f5' },
 

  skeletonCard: {backgroundColor: '#FFFFFF',borderRadius: 12,padding: 16,marginVertical: 8,marginHorizontal: 16,shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },shadowOpacity: 0.05,shadowRadius: 4, elevation: 2,},
  skeletonHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  skeletonTitle: { width: '60%', height: 20, backgroundColor: '#E0E0E0', borderRadius: 4 },
  skeletonBadge: { width: 70, height: 24, backgroundColor: '#E0E0E0', borderRadius: 8 },
  skeletonTextRow: { width: '80%', height: 14, backgroundColor: '#EEEEEE', borderRadius: 4, marginBottom: 8 },
  skeletonTextRowShort: { width: '40%', height: 14, backgroundColor: '#EEEEEE', borderRadius: 4 },

  sectionTitle: {fontSize: 18,fontWeight: 'bold',color: '#1a1a1a',marginBottom: 16,marginLeft: 4,},
  quickActionsCard: {backgroundColor: '#FFFFFF',borderRadius: 16,padding: 20,marginHorizontal: 16,marginTop: 24,shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },shadowOpacity: 0.05,shadowRadius: 8,elevation: 3,},

  actionGrid: {flexDirection: 'row',flexWrap: 'wrap', justifyContent: 'flex-start', gap: '3%'},
  actionButton: {width: '30%', alignItems: 'center',marginBottom: 20, },
  iconCircle: {width: 64,height: 64,borderRadius: 20, justifyContent: 'center',alignItems: 'center',marginBottom: 8,},
  actionText: {fontSize: 13,fontWeight: '600',color: '#4a4a4a',textAlign: 'center',},
  badge: {position: 'absolute',top: -4,right: -4,backgroundColor: '#FF3B30',borderRadius: 12,minWidth: 24,height: 24,justifyContent: 'center',alignItems: 'center',
  borderWidth: 2,borderColor: '#FFF',},
  badgeText: {color: '#FFF',fontSize: 12,fontWeight: 'bold',},
  greetingContainer: {paddingHorizontal: 20,paddingTop: 30,paddingBottom: 20,},
  greetingText: {fontSize: 26, fontWeight: 'bold',color: '#333333', },
  nameText: {color: '#502fb4',},
  subtitleText: {fontSize: 16,color: '#757575',marginTop: 5,},
});