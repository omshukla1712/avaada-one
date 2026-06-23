import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker'; 
import DateTimePicker from '@react-native-community/datetimepicker';
import BookingService from '../services/BookingService';

const AVAILABLE_AMENITIES = [
  { id: 1, name: 'Projector' },
  { id: 2, name: 'Whiteboard' },
  { id: 3, name: 'WiFi' },
  { id: 4, name: 'Monitor' },
  { id: 5, name: 'Video Conferencing' }
];

const RoomCard = ({ room, onSelect }) => (
  <TouchableOpacity 
    style={[styles.roomCard, { borderColor: '#4CAF50', borderWidth: 1 }]} 
    onPress={() => onSelect(room)} 
    activeOpacity={0.7}
  >
    <View style={styles.roomCardHeader}>
      <Text style={styles.roomCardTitle}>{room.name || room.room_name}</Text>
      <View style={[styles.statusBadge, { backgroundColor: '#E8F5E9' }]}>
        <Text style={[styles.statusBadgeText, { color: '#2E7D32' }]}>AVAILABLE</Text>
      </View>
    </View>

    {room.amenities && room.amenities.length > 0 && (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
        {room.amenities.map((a, index) => (
          <View key={a.id || a.amenity_id || `amenity-${index}`} style={{
              backgroundColor: '#1E1E1E', 
              paddingHorizontal: 10, 
              paddingVertical: 5, 
              borderRadius: 12, 
              borderWidth: 1, 
              borderColor: '#444',
              marginRight: 6, 
              marginBottom: 6
          }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#E0E0E0' }}>
                {(a.amenity_name || a.name || 'AMENITY').toUpperCase()}
            </Text>
          </View>
        ))}
      </View>
    )}

    <View style={styles.roomCardBody}>
      <Text style={styles.subTextLabel}>CAPACITY</Text>
      <Text style={styles.subTextValue}>{room.capacity} People</Text>
    </View>
  </TouchableOpacity>
);

export default function RoomSelectionScreen({ navigation }) {
  // Dynamic offices state replacing the old hardcoded array
  const [offices, setOffices] = useState([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState(null); 

  const [rooms, setRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isLoadingOffices, setIsLoadingOffices] = useState(true);

  const [searchDate, setSearchDate] = useState(new Date());
  const [searchStartTime, setSearchStartTime] = useState(new Date());
  const [searchEndTime, setSearchEndTime] = useState(new Date(new Date().getTime() + 60 * 60 * 1000));
  
  const [capacity, setCapacity] = useState('1');
  const [frequency, setFrequency] = useState('NONE'); 
  const [searchEndDate, setSearchEndDate] = useState(new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000));
  
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date');
  const [activeField, setActiveField] = useState('');

  const formatDate = (date) => date.toISOString().split('T')[0];
  const formatTime = (date) => date.toTimeString().split(' ')[0].substring(0, 5);

  useEffect(() => {
    const loadOffices = async () => {
      try {
        setIsLoadingOffices(true);
        const data = await BookingService.getOffices(); 
        if (data && data.length > 0) {
          setOffices(data);
          setSelectedOfficeId(data[0].id);
        }
      } catch (error) {
        console.log("Office fetch failed:", error.message);
        Alert.alert("Error", "Failed to load working office locations.");
      } finally {
        setIsLoadingOffices(false);
      }
    };
    loadOffices();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (selectedOfficeId) fetchRooms();
    }, [selectedOfficeId, searchDate, searchStartTime, searchEndTime, capacity, frequency, searchEndDate, selectedAmenities])
  );

  const fetchRooms = async () => {
    if (!selectedOfficeId) return;
    
    setIsLoadingRooms(true);
    setRooms([]); 

    try {
      const payload = {
          office_id: selectedOfficeId,
          start_date: formatDate(searchDate),
          end_date: frequency === 'NONE' ? formatDate(searchDate) : formatDate(searchEndDate),
          start_time: formatTime(searchStartTime),
          end_time: formatTime(searchEndTime),
          number_of_members: parseInt(capacity) || 1,
          frequency: frequency
      };

      if (selectedAmenities.length > 0) {
          payload.required_amenities = selectedAmenities;
      }

      const data = await BookingService.searchAvailableRooms(payload);
      setRooms(data);
    } catch (error) { 
      console.log("Room fetch failed. ", error.message);
    } finally { 
      setIsLoadingRooms(false); 
    }
  };

  const toggleAmenity = (id) => {
    if (selectedAmenities.includes(id)) {
        setSelectedAmenities(selectedAmenities.filter(a => a !== id));
    } else {
        setSelectedAmenities([...selectedAmenities, id]);
    }
  };

  const handlePickerChange = (event, selectedDate) => {
    setShowPicker(Platform.OS === 'ios');
    if (!selectedDate) return;
    
    if (activeField === 'date') {
        setSearchDate(selectedDate);
        if (selectedDate > searchEndDate) setSearchEndDate(selectedDate);
    }
    if (activeField === 'endDate') setSearchEndDate(selectedDate);
    if (activeField === 'startTime') setSearchStartTime(selectedDate);
    if (activeField === 'endTime') setSearchEndTime(selectedDate);
  };

  const openPicker = (field, mode) => { 
    setActiveField(field); 
    setPickerMode(mode); 
    setShowPicker(true); 
  };

  const handleRoomSelect = (room) => {
    const selectedOfficeData = offices.find(o => o.id === selectedOfficeId);
    
    navigation.navigate('BookingForm', { 
        office: selectedOfficeData, 
        room: room,
        passedParams: {
            startDate: formatDate(searchDate),
            endDate: frequency === 'NONE' ? formatDate(searchDate) : formatDate(searchEndDate),
            startTime: formatTime(searchStartTime),
            endTime: formatTime(searchEndTime),
            frequency: frequency,
            capacity: parseInt(capacity) || 1
        }
    });
  };

  if (isLoadingOffices) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={{ marginTop: 12, color: '#666' }}>Loading corporate configurations...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Select Office *</Text>
        <View style={styles.pickerContainer}>
          <Picker 
            selectedValue={selectedOfficeId} 
            onValueChange={(itemValue) => setSelectedOfficeId(itemValue)} 
            style={styles.picker}
          >
            {offices.map(office => (
              <Picker.Item key={office.id} label={office.name || office.office_name} value={office.id} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.searchPanel}>
          <Text style={styles.label}>Meeting Details</Text>
          <View style={[styles.row, {marginBottom: 10}]}>
              <View style={{flex: 1, marginRight: 10}}>
                  <Text style={styles.subLabel}>Attendees</Text>
                  <TextInput 
                      style={styles.textInput} 
                      value={capacity} 
                      onChangeText={setCapacity} 
                      keyboardType="numeric" 
                      placeholder="Enter a number"
                  />
              </View>
              <View style={{flex: 1}}>
                  <Text style={styles.subLabel}>Frequency</Text>
                  <View style={styles.pickerContainerSmall}>
                      <Picker selectedValue={frequency} onValueChange={setFrequency} style={styles.pickerSmall}>
                          <Picker.Item label="Once" value="NONE" />
                          <Picker.Item label="Daily" value="DAILY" />
                          <Picker.Item label="Weekly" value="WEEKLY" />
                          <Picker.Item label="Monthly" value="MONTHLY" />
                      </Picker>
                  </View>
              </View>
          </View>

         <Text style={styles.label}>2. Date & Time</Text>
          <View style={[styles.row, {marginBottom: 10}]}>
              
              {/* Date Column */}
              <View style={{flex: 1, marginRight: 8}}>
                  <Text style={styles.subLabel}>Date</Text>
                  <TouchableOpacity style={styles.ghostButton} onPress={() => openPicker('date', 'date')}>
                      <Text style={styles.ghostButtonText}>📅 {formatDate(searchDate)}</Text>
                  </TouchableOpacity>
              </View>

              {/* Start Time Column */}
              <View style={{flex: 1, marginRight: 8}}>
                  <Text style={styles.subLabel}>Start Time</Text>
                  <TouchableOpacity style={styles.ghostButton} onPress={() => openPicker('startTime', 'time')}>
                      <Text style={styles.ghostButtonText}>🕒 {formatTime(searchStartTime)}</Text>
                  </TouchableOpacity>
              </View>

              {/* End Time Column */}
              <View style={{flex: 1}}>
                  <Text style={styles.subLabel}>End Time</Text>
                  <TouchableOpacity style={styles.ghostButton} onPress={() => openPicker('endTime', 'time')}>
                      <Text style={styles.ghostButtonText}>🕒 {formatTime(searchEndTime)}</Text>
                  </TouchableOpacity>
              </View>

          </View>

          {frequency !== 'NONE' && (
              <View style={{marginBottom: 10}}>
                  <Text style={styles.subLabel}>Repeat Until</Text>
                  <TouchableOpacity style={[styles.ghostButton, {width: '50%'}]} onPress={() => openPicker('endDate', 'date')}>
                      <Text style={styles.ghostButtonText}>🛑 {formatDate(searchEndDate)}</Text>
                  </TouchableOpacity>
              </View>
          )}

          <Text style={styles.label}>3. Required Amenities</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
              {AVAILABLE_AMENITIES.map(amenity => {
                  const isSelected = selectedAmenities.includes(amenity.id);
                  return (
                      <TouchableOpacity 
                          key={amenity.id} 
                          onPress={() => toggleAmenity(amenity.id)}
                          style={{
                              paddingHorizontal: 14, 
                              paddingVertical: 8, 
                              borderRadius: 20, 
                              borderWidth: 1, 
                              borderColor: isSelected ? '#1565C0' : '#90CAF9', 
                              backgroundColor: isSelected ? '#1565C0' : '#FFF',
                              marginRight: 8, 
                              marginBottom: 8 
                          }}
                      >
                          <Text style={{
                              fontSize: 12, 
                              fontWeight: '600', 
                              color: isSelected ? '#FFF' : '#1565C0'
                          }}>
                              {isSelected ? '✓ ' : ''}{amenity.name}
                          </Text>
                      </TouchableOpacity>
                  );
              })}
          </View>
      </View>

     {showPicker && (
          <DateTimePicker 
              value={
                  activeField === 'endDate' ? searchEndDate : 
                  activeField === 'startTime' ? searchStartTime : 
                  activeField === 'endTime' ? searchEndTime : 
                  searchDate
              } 
              mode={pickerMode} 
              is24Hour={true} 
              onChange={handlePickerChange} 
          />
      )}
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Available Rooms ({rooms.length})</Text>
        {isLoadingRooms ? <ActivityIndicator size="large" color="#2196F3" style={{marginTop: 20}} /> : (
          <View style={styles.gridContainer}>
            {rooms.map((room, index) => (
              <RoomCard 
                  key={room.id || room.room_id || `room-${index}`} 
                  room={room} 
                  onSelect={handleRoomSelect} 
              />
            ))}
            {rooms.length === 0 && <Text style={{color: '#666', marginTop: 10}}>No rooms fit these exact criteria.</Text>}
          </View>
        )}
      </View>
   </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 8 },
  subLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 4 },
  
  pickerContainer: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, height: 56, justifyContent: 'center' },
  picker: { height: 56, width: '100%' },
  
  pickerContainerSmall: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, height: 52, justifyContent: 'center' },
  pickerSmall: { height: 52, width: '100%' },
  textInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, height: 52, paddingHorizontal: 12, fontSize: 15 },
  searchPanel: { backgroundColor: '#c0e6f8', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#BBDEFB', zIndex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  ghostButton: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CCC', borderRadius: 8, paddingHorizontal: 4, height: 52, justifyContent: 'center', alignItems: 'center', marginHorizontal: 2 },
  ghostButtonText: { fontSize: 12, color: '#333', fontWeight: '600', textAlign: 'center' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 5 },
  roomCard: { width: '100%', backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  roomCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  roomCardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  statusBadgeText: { fontSize: 11, fontWeight: 'bold' },
  roomCardBody: { backgroundColor: '#F9F9F9', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#EEE' },
  subTextLabel: { fontSize: 10, fontWeight: '700', color: '#888', marginBottom: 4 },
  subTextValue: { fontSize: 13, fontWeight: '600', color: '#333' }
});