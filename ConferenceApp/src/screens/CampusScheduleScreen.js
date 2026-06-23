import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import BookingService from '../services/BookingService';
import { useNavigation } from '@react-navigation/native';

export default function CampusScheduleScreen() {

    const navigation = useNavigation();
    const HARDCODED_OFFICES = [
  { id: 7, name: 'Noida - 62 Tower C 4th Floor' },
  { id: 6, name: 'Noida-65' },
  { id: 5, name: 'Noida-62 - Tower A 5th Floor' },
  { id: 4, name: 'Noida 62 - Tower B Ground Floor' },
  { id: 2, name: 'Delhi' },
  { id: 3, name: 'Mumbai' },
  {id: 8, name: 'Butibori'},
  {id:1, name: 'Dadri'},
  { id: 999, name: 'Test Office (Demo Mode)' },
];


    const [filters, setFilters] = useState({
        status: 'ACTIVE', 
        frequency: '',
        searchString: '',
        office_id: '',
        orderBy: 'start_date',
        order: 'ASC'
    });

    const [searchInput, setSearchInput] = useState(''); 
    const [schedule, setSchedule] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchSchedule = async () => {
            setIsLoading(true);
            try {
                const activeFilters = {};
                Object.keys(filters).forEach(key => {
                    if (filters[key] !== '') activeFilters[key] = filters[key];
                });

                const data = await BookingService.getCampusSchedule(activeFilters);
                setSchedule(data);
            } catch (error) {
                console.log("Failed to fetch schedule", error);
                setSchedule([]); 
            } finally {
                setIsLoading(false);
            }
        };

        fetchSchedule();
    }, [filters]); 

    const handleStatusChange = (newStatus) => {
        setFilters(prev => ({ ...prev, status: newStatus }));
    };

  const handleOfficeChange = (newOfficeId) => {
        setFilters(prev => ({ 
            ...prev, 
            office_id: prev.office_id === newOfficeId ? '' : newOfficeId 
        }));
    };

    const handleSearchSubmit = () => {
        setFilters(prev => ({ ...prev, searchString: searchInput }));
    };

   const renderMeetingCard = ({ item }) => {
        const roomName = item.conference_rooms?.[0]?.room_name 
                      || item.conference_rooms?.[0]?.name 
                      || item.room_name 
                      || 'Room TBA';

        const matchedOffice = HARDCODED_OFFICES.find(office => office.id === item.office_id);
        const officeName = item.office_name 
                        || matchedOffice?.name 
                        || `Office ID: ${item.office_id || 'TBA'}`;

        return (
            <TouchableOpacity 
                style={styles.card}
                onPress={() => navigation.navigate('BookingDetail', { booking: item })}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.meetingTitle}>{item.title || 'Untitled Meeting'}</Text>
                    <Text style={[styles.statusBadge, { color: item.status === 'CANCELLED' ? 'red' : 'green' }]}>
                        {item.status}
                    </Text>
                </View>
                <Text style={styles.meetingDetail}>📅 {item.start_date} | 🕒 {item.start_time} - {item.end_time}</Text>
                
                <Text style={styles.meetingDetail}>📍 {roomName} ({officeName})</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search meetings, users, or rooms..."
                    value={searchInput}
                    onChangeText={setSearchInput}
                    onSubmitEditing={handleSearchSubmit} 
                    returnKeyType="search"
                />
            </View>

            <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Locations:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>
                    {HARDCODED_OFFICES.map(office => (
                        <TouchableOpacity 
                            key={office.id === '' ? 'all' : office.id}
                            style={[styles.filterChip, filters.office_id === office.id && styles.activeChip]}
                            onPress={() => handleOfficeChange(office.id)}
                        >
                            <Text style={[styles.chipText, filters.office_id === office.id && styles.activeChipText]}>
                                {office.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Status Filters */}
            <View style={[styles.filterSection, { borderBottomWidth: 1, borderColor: '#E0E0E0', paddingBottom: 10 }]}>
                <Text style={styles.filterLabel}>Status:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>
                    <TouchableOpacity 
                        style={[styles.filterChip, filters.status === 'ACTIVE' && styles.activeChip]}
                        onPress={() => handleStatusChange('ACTIVE')}
                    >
                        <Text style={[styles.chipText, filters.status === 'ACTIVE' && styles.activeChipText]}>Active</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.filterChip, filters.status === 'CANCELLED' && styles.activeChip]}
                        onPress={() => handleStatusChange('CANCELLED')}
                    >
                        <Text style={[styles.chipText, filters.status === 'CANCELLED' && styles.activeChipText]}>Cancelled</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.filterChip, filters.status === '' && styles.activeChip]}
                        onPress={() => handleStatusChange('')}
                    >
                        <Text style={[styles.chipText, filters.status === '' && styles.activeChipText]}>All</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {isLoading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#2196F3" />
                </View>
            ) : (
                <FlatList
                    data={schedule}
                    keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                    renderItem={renderMeetingCard}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>No meetings found matching these filters.</Text>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    searchContainer: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E0E0E0' },
    searchInput: { backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#DDD' },
    
    filterSection: { backgroundColor: '#FFF', paddingTop: 10 },
    filterLabel: { fontSize: 12, fontWeight: 'bold', color: '#888', marginLeft: 16, marginBottom: 5 },
    scrollPad: { paddingHorizontal: 16 },
    filterChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#EEE', marginRight: 10 },
    activeChip: { backgroundColor: '#2196F3' },
    chipText: { color: '#555', fontWeight: '600' },
    activeChipText: { color: '#FFF' },
    
    listContent: { padding: 16 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { textAlign: 'center', marginTop: 40, color: '#888', fontStyle: 'italic' },
    
    card: { backgroundColor: '#FFF', padding: 16, borderRadius: 10, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    meetingTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    statusBadge: { fontSize: 12, fontWeight: 'bold' },
    meetingDetail: { fontSize: 14, color: '#666', marginTop: 4 }
});