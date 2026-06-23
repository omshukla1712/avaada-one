import React, { useCallback, useContext, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from "@react-navigation/native";
import { AuthContext } from "../context/AuthContext";
import { fetchUserBookings } from "../services/BookingService";
import BookingCard from "../components/BookingCard";

export default function MyMeetingsHubScreen({ navigation }) {
    const [activeTab, setActiveTab] = useState('Upcoming');
    const tabs = ['Upcoming', 'Pending' ,'Past', 'Cancelled'];
    
    const { currentUser } = useContext(AuthContext);

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const [upcomingMeetings, setUpcomingMeetings] = useState([]);
    const [pendingMeetings, setPendingMeetings] = useState([]);
    const [pastMeetings, setPastMeetings] = useState([]);
    const [cancelledMeetings, setCancelledMeetings] = useState([]);

    const loadAndSortBookings = async () => {
        try {
            if (!isRefreshing) setIsLoading(true); 
            
            const data = await fetchUserBookings();
            
            if (!Array.isArray(data)) {
                throw new Error("Invalid data format received from backend.");
            }

            const now = new Date();
            const upcoming = [];
            const pending = [];
            const past = [];
            const cancelled = [];

            data.forEach(booking => {
                
                const dateStr = booking.start_date.split('T')[0];
                const endTimeStr = (booking.end_time || booking.start_time).substring(0, 5);
                const startTimeStr = booking.start_time.substring(0, 5);
                
                const meetingStart = new Date(`${dateStr}T${startTimeStr}:00`);
                const meetingEnd = new Date(`${dateStr}T${endTimeStr}:00`);

                const bookingWithDate = { ...booking, _parsedStart: meetingStart };

                if (booking.status === 'CANCELLED') {
                    cancelled.push(bookingWithDate);
                } 
                else if (meetingEnd <= now) {
                    past.push({...bookingWithDate, status:'COMPLETED'});
                } 
                else if (booking.status?.toUpperCase() === 'PENDING' || booking.final_approval?.toUpperCase() === 'PENDING') {
                pending.push(bookingWithDate);
                }
                else {
                    upcoming.push(bookingWithDate);
                }
            });

            upcoming.sort((a, b) => a._parsedStart - b._parsedStart);
            past.sort((a, b) => b._parsedStart - a._parsedStart);
            cancelled.sort((a, b) => b._parsedStart - a._parsedStart);

            setUpcomingMeetings(upcoming);
            setPendingMeetings(pending);
            setPastMeetings(past);
            setCancelledMeetings(cancelled);
            
        } catch(error) {
            console.error("Failed to fetch/sort bookings:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false); 
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadAndSortBookings();
        }, [])
    );

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadAndSortBookings();
    }, []);

    const renderContent = () => {
        if(isLoading){
            return(
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2196F3" />
                </View>
            );
        }
        
        let currentData = [];
        if (activeTab === 'Upcoming') currentData = upcomingMeetings;
        if (activeTab === 'Pending') currentData = pendingMeetings;
        if (activeTab === 'Past') currentData = pastMeetings;
        if (activeTab === 'Cancelled') currentData = cancelledMeetings;
        
        return (
          <FlatList
            data={currentData}
            keyExtractor={(item) => `${item.id || item.booking_id}-${item.start_date}`}
            contentContainerStyle={styles.listPadding}
            renderItem={({ item }) => (
              <BookingCard
                booking={item}
                currentUserEmail={currentUser?.emailid}
                onCardPress={() => {
                  if (item.status !== 'CANCELLED') {
                    navigation.navigate('BookingDetail', { booking: item });
                  }
                }}
              />
            )}
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <Text style={styles.placeholderText}>
                  No {activeTab.toLowerCase()} meetings found.
                </Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={['#2196F3']}
                tintColor="#2196F3"
              />
            }
          />
        );
    }
    
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.tabContainer}>
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                
               <View style={styles.contentArea}>
                    {renderContent()}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  backButton: { padding: 8 },
  backButtonText: { color: '#2196F3', fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFF', paddingHorizontal: 16, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTabButton: { borderBottomColor: '#2196F3' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#7f8c8d' },
  activeTabText: { color: '#2196F3' },

  contentArea: { flex: 1, backgroundColor: '#F5F7FA' },
  placeholderText: { fontSize: 16, color: '#95a5a6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listPadding: { padding: 16, paddingBottom: 40 },
});