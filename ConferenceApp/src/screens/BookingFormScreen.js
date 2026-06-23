import React, { useState,useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import BookingService from '../services/BookingService';
import { AuthContext } from '../context/AuthContext';

export default function BookingFormScreen({ route, navigation }) {
  const { office, room, passedParams } = route.params;
  const { currentUser } = useContext(AuthContext);

  const [title, setTitle] = useState('');
  const [guestEmailInput, setGuestEmailInput] = useState('');
  const [guestEmails, setGuestEmails] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSearchDirectory = () => {
      const query = guestEmailInput.trim();
      if (query.length < 2) {
          Alert.alert("Notice", "Please enter at least 2 characters to search.");
          return;
      }
      triggerUserSearch(query);
  };

const triggerUserSearch = async (query) => {
      setIsSearching(true);
      setShowDropdown(true);
      try {
        console.log(`\n--- REAL API SEARCH FOR: "${query}" ---`);
        const responseData = await BookingService.searchUsers(query);
        console.log("RAW DATA RETURNED TO COMPONENT:", JSON.stringify(responseData));  
          let safeArray = [];
          if (Array.isArray(responseData)) {
              safeArray = responseData; 
          } else if (responseData?.body?.data?.rows) {
              safeArray = responseData.body.data.rows; 
          } else if (responseData?.data?.rows) {
              safeArray = responseData.data.rows;
          } else if (responseData?.data && Array.isArray(responseData.data)) {
              safeArray = responseData.data;
          }
          console.log(` EXTRACTED DATA ${safeArray.length} USERS`);
          setSearchResults(safeArray);

      } catch (error) {
          console.log("FALLBACK: API rejected. Loading Mock Directory.");
          console.error("SYSTEM CRASH IN COMPONENT:", error);
          Alert.alert("Debug Error", error.message || "Something crashed");
          setSearchResults([]);
      } finally {
          setIsSearching(false);
      }
  };

  const handleSelectUser = (user) => {
      const email = user.company_email_id;
      
      if (!email) { 
          Alert.alert('Error', 'No email found for this user.'); 
          return; 
      }
      if (guestEmails.includes(email)) { 
          Alert.alert('Duplicate', 'This user is already added.'); 
          return; 
      }

      setGuestEmails([...guestEmails, email]);
      setGuestEmailInput(''); 
      setSearchResults([]);
      setShowDropdown(false);
  };

  const handleAddGuest = () => {
    const email = guestEmailInput.trim();
    if (!email) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { 
        Alert.alert('Invalid Email', 'Please select a user from the list or enter a valid email format.'); 
        return; 
    }
    if (guestEmails.includes(email)) { 
        Alert.alert('Duplicate', 'Email already added.'); 
        return; 
    }
    
    setGuestEmails([...guestEmails, email]);
    setGuestEmailInput('');
    setSearchResults([]);
    setShowDropdown(false);
  };

 
  const handleRemoveGuest = (indexToRemove) => {
    setGuestEmails(guestEmails.filter((_, index) => index !== indexToRemove));
  };

  const handleBookRoom = async () => {
    if (!title.trim()) { 
        Alert.alert('Error', 'Meeting Title is required.'); 
        return; 
    }
    setIsSubmitting(true);
   const payload = {
      office_id: office.id,
      conference_room_ids: [room.id || room.room_id], 
      title: title.trim(),
      start_date: passedParams.startDate,
      end_date: passedParams.endDate || passedParams.startDate,
      start_time: passedParams.startTime,
      end_time: passedParams.endTime,
      number_of_members: Number(passedParams.capacity) || 1, 
      frequency: passedParams.frequency || "NONE",
      user_id: currentUser?.userid, 
    };

    try {
      await BookingService.createBooking(payload);
      Alert.alert('Success', 'Room successfully booked!', [
       { text: 'OK', onPress: () => navigation.navigate('Dashboard') }
      ]);
    } catch (error) {
      Alert.alert('Booking Failed', error.message || 'Failed to submit booking.');
    } finally {
      setIsSubmitting(false);
    }
  };
return (
    <ScrollView 
    style={styles.container} 
    keyboardShouldPersistTaps="handled"
    scrollEnabled={!showDropdown}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Edit Search Details</Text>
      </TouchableOpacity>

      <View style={styles.summaryCard}>
        <Text style={styles.locationTitle}>📍 {office.name}</Text>
        <Text style={styles.locationSubtitle}>{room.name || room.room_name}</Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.summaryText}>
            📅 Date: {passedParams.startDate} {passedParams.frequency !== 'NONE' ? `(Until ${passedParams.endDate})` : ''}
        </Text>
        <Text style={styles.summaryText}>🕒 Time: {passedParams.startTime} - {passedParams.endTime}</Text>
        <Text style={styles.summaryText}>🔄 Frequency: {passedParams.frequency}</Text>
        <Text style={styles.summaryText}>👥 Attendees: {passedParams.capacity}</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Meeting Title *</Text>
        <TextInput 
          style={styles.textInput} 
          value={title} 
          onChangeText={setTitle} 
          placeholder="e.g. Q3 Sync" 
        />
      </View>

      <View style={[styles.inputGroup, { zIndex: 10 }]}>
        <Text style={styles.label}>Guest Emails (Optional)</Text>
        <Text style={styles.warningLabel}>* Please add your own email if you are attending</Text>
        
        <View>
            <TextInput 
                style={styles.textInput} 
                value={guestEmailInput} 
                onChangeText={(text) => {
                    setGuestEmailInput(text);
                    setShowDropdown(false); 
                }}
                placeholder="Search name or enter email..." 
                keyboardType="email-address" 
                autoCapitalize="none" 
                onSubmitEditing={handleAddGuest}    
            />
            
            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.searchBtn} onPress={handleSearchDirectory}>
                    <Text style={styles.searchBtnText}>🔍 Search Directory</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.addBtn} onPress={handleAddGuest}>
                    <Text style={styles.addBtnText}>Add External</Text>
                </TouchableOpacity>
            </View>
            {showDropdown && (
                <ScrollView 
                    style={styles.dropdownContainer}
                    keyboardShouldPersistTaps="handled" 
                    nestedScrollEnabled={true} 
                >
                    {isSearching ? (
                        <ActivityIndicator style={{ padding: 16 }} color="#2196F3" />
                    ) : searchResults.length > 0 ? (
                        searchResults.map((user, index) => (
                            <TouchableOpacity
                                key={user.id || index}
                                style={styles.dropdownItem}
                                onPress={() => handleSelectUser(user)}
                            >
                                <Text style={styles.dropdownItemText}>{user.full_name}</Text>
                                <Text style={styles.dropdownItemSub}>{user.company_email_id}</Text>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={styles.noResultsText}>
                            No users found. Click "Add External" to invite external email.
                        </Text>
                    )}
                </ScrollView>
            )}
        </View>
        
        <View style={{ marginTop: 10 }}>
          {guestEmails.map((email, index) => (
            <View key={index} style={styles.tagRow}>
              <Text style={styles.tagText}>✉️ {email}</Text>
              <TouchableOpacity onPress={() => handleRemoveGuest(index)}>
                <Text style={styles.tagDelete}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
        onPress={handleBookRoom} 
        disabled={isSubmitting}
      >
        {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
        ) : (
            <Text style={styles.submitButtonText}>Confirm Booking</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 16 },
  backButton: { marginBottom: 15, paddingVertical: 5 },
  backButtonText: { color: '#2196F3', fontSize: 16, fontWeight: '600' },
  
  summaryCard: { backgroundColor: '#E3F2FD', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#BBDEFB' },
  locationTitle: { fontSize: 14, color: '#1565C0', fontWeight: 'bold', marginBottom: 4 },
  locationSubtitle: { fontSize: 20, color: '#0D47A1', fontWeight: '900', marginBottom: 10 },
  divider: { height: 1, backgroundColor: '#BBDEFB', marginBottom: 10 },
  summaryText: { fontSize: 14, color: '#1565C0', fontWeight: '600', marginBottom: 4 },
  
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 4 },
  warningLabel: { fontSize: 12, fontWeight: '600', color: '#D32F2F', marginBottom: 8 },
  
  textInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, fontSize: 16 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  addButton: { backgroundColor: '#2196F3', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, borderRadius: 8 },
  addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  dropdownContainer: { position: 'absolute', top: 100, left: 0, right: 90, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, elevation: 5, zIndex: 1000, maxHeight: 200, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  dropdownItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  dropdownItemText: { fontSize: 14, fontWeight: '600', color: '#333' },
  dropdownItemSub: { fontSize: 11, color: '#777', marginTop: 2 },
  noResultsText: { padding: 16, color: '#888', textAlign: 'center', fontStyle: 'italic', fontSize: 12 },
  
  tagRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#E3F2FD', padding: 12, borderRadius: 8, marginBottom: 8 },
  tagText: { color: '#1976D2', fontSize: 16, fontWeight: '500' },
  tagDelete: { color: '#D32F2F', fontSize: 18, fontWeight: 'bold' },
  
  submitButton: { backgroundColor: '#4CAF50', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 40 },
  submitButtonDisabled: { backgroundColor: '#A5D6A7' },
  submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 5 },
  searchBtn: { flex: 1, backgroundColor: '#E3F2FD', borderWidth: 1, borderColor: '#2196F3', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginRight: 5 },
  searchBtnText: { color: '#1565C0', fontWeight: 'bold', fontSize: 14 },
  addBtn: { flex: 1, backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#4CAF50', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginLeft: 5 },
  addBtnText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 14 },
});