import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchAdminDirectory } from '../services/BookingService';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function AdminDirectoryScreen({ navigation }) {
    const [admins, setAdmins] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAdmins = async () => {
            try {
                const data = await fetchAdminDirectory();
                
                if (data && data.length > 0) {
                    setAdmins(data);
                } else {
                    throw new Error("Empty response"); 
                }
            } catch (error) {
                console.error(error.message)
            } finally {
                setIsLoading(false);
            }
        };

        loadAdmins();
    }, []);

    const handleEmail = (email) => {
        const url = `mailto:${email}`;
        Linking.canOpenURL(url).then(supported => {
            if (supported) Linking.openURL(url);
            else Alert.alert("Error", "No email client found on this device.");
        });
    };

    const renderAdminCard = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.nameText}>{item.name}</Text>
                    <Text style={styles.officeText}> {item.office?.name || "Corporate Office"}</Text>
                </View>
                <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{item.role_code || item.role}</Text>
                </View>
            </View>
            
            <TouchableOpacity style={styles.emailButton} onPress={() => handleEmail(item.email)}>
                <Ionicons name="mail-outline" size={18} color="#2196F3" />
                <Text style={styles.emailText}>{item.email}</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()} 
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} 
                >
                    <Ionicons name="arrow-back" size={24} color="#333333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Admin Directory</Text>
            </View>

            {isLoading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#2196F3" />
                </View>
            ) : (
                <FlatList
                    data={admins}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listPadding}
                    renderItem={renderAdminCard}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E0E0E0' },
    backText: { color: '#2196F3', fontSize: 16, fontWeight: '600' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listPadding: { padding: 16 },
    
    card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    nameText: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    officeText: { fontSize: 16, color: '#666' },
    roleBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    roleText: { fontSize: 10, fontWeight: 'bold', color: '#1565C0' },
    
    emailButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', padding: 10, borderRadius: 8 },
    emailText: { fontSize: 14, color: '#2196F3', fontWeight: '500', marginLeft: 8 },
     backButton: {marginRight: 16,},
});