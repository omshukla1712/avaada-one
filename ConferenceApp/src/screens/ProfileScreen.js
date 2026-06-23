import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { AuthContext } from '../context/AuthContext'; 
import { fetchUserOffices } from '../services/BookingService'; 
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function ProfileScreen({ navigation }) {
    const { currentUser, login, logout } = useContext(AuthContext);
    const [roleDisplay, setRoleDisplay] = useState("Loading...");
    const [isLoadingRole, setIsLoadingRole] = useState(true);

    const user = currentUser || {
        full_name: "Loading...",
        emailid: "Loading...",
        userid: "--",
        employee_id: "--"
    };

    useEffect(() => {
        const fetchRoleData = async () => {
            try {
                const officeData = await fetchUserOffices();
                
                if (officeData && officeData.length > 0) {
                    const primary = officeData[0];
                    const officeName = primary?.office?.name || "Corporate";
                    const roleName = primary?.role?.role_name || "Employee";
                    
                    setRoleDisplay(`${officeName} • ${roleName}`);
                } else {
                    setRoleDisplay("Avaada Employee");
                }
            } catch (error) {
                console.log("DEMO LOG: Role fetch failed/blocked. Defaulting to fallback.", error.message);
                setRoleDisplay("Avaada Employee"); 
            } finally {
                setIsLoadingRole(false);
            }
        };

        fetchRoleData();
    }, []);

    const toggleDeveloperIdentity = () => {
        if (currentUser?.userid === 123 || currentUser?.userid === "123") {
            login({
                ...currentUser,
                userid: 456,
                full_name: 'Guest User',
                emailid: 'guest.user@avaada.com',
                employee_id: '20190'
            });
            Alert.alert("Dev Mode", "Identity swapped to Guest User (456)");
        } else {
            login({
                ...currentUser,
                userid: 123,
                full_name: 'Test User',
                emailid: 'test.user@avaada.com',
                employee_id: '20189'
            });
            Alert.alert("Dev Mode", "Identity swapped to Test User (123)");
        }
    };

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
                <Text style={styles.headerTitle}>User Profile</Text>
            </View>
            <ScrollView contentContainerStyle={styles.container}>
                
                <View style={styles.avatarSection}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                            {user.full_name ? user.full_name.charAt(0).toUpperCase() : '?'}
                        </Text>
                    </View>
                    <Text style={styles.userName}>{user.full_name}</Text>
                    {isLoadingRole ? (
                        <ActivityIndicator size="small" color="#2196F3" style={{ marginTop: 5 }}/>
                    ) : (
                        <Text style={styles.userRole}>{roleDisplay}</Text>
                    )}
                </View>

                <View style={styles.detailsCard}>
                    <Text style={styles.sectionTitle}>Account Information</Text>
                    
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Email</Text>
                        <Text style={styles.detailValue}>{user.emailid}</Text>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Employee ID</Text>
                        <Text style={styles.detailValue}>{user.employee_id}</Text>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>System User ID</Text>
                        <Text style={styles.detailValue}>{user.userid}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Text style={styles.logoutButtonText}>Log Out</Text>
                </TouchableOpacity>

                {__DEV__ && (
                    <View style={styles.devToggleContainer}>
                        <Text style={styles.devToggleTitle}>🛠 Developer Tools (Local Only)</Text>
                        <TouchableOpacity 
                            style={styles.devToggleButton} 
                            onPress={toggleDeveloperIdentity}
                        >
                            <Text style={styles.devToggleButtonText}>
                                Swap to {currentUser?.userid === 123 || currentUser?.userid === "123" ? 'Guest Role' : 'Organizer Role'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
    container: { padding: 20, alignItems: 'center' },
    
    avatarSection: { alignItems: 'center', marginBottom: 30, marginTop: 20 },
    avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#7bdb37', justifyContent: 'center',
         alignItems: 'center', marginBottom: 15, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, 
         shadowOpacity: 0.2, shadowRadius: 4 },
    avatarText: { fontSize: 40, color: '#FFF', fontWeight: 'bold' },
    userName: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginBottom: 5 },
    userRole: { fontSize: 16, color: '#7F8C8D', fontWeight: '500' },
    
    detailsCard: { width: '100%', backgroundColor: '#FFF', borderRadius: 15, padding: 20, marginBottom: 30, elevation: 2,
         shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#34495E', marginBottom: 15 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
    detailLabel: { fontSize: 15, color: '#7F8C8D', fontWeight: '600' },
    detailValue: { fontSize: 16, color: '#2C3E50', fontWeight: '500' },
    
    divider: { height: 1, backgroundColor: '#ECF0F1', marginVertical: 5 },
    
    logoutButton: { width: '100%', backgroundColor: '#E74C3C', paddingVertical: 15, borderRadius: 10, alignItems: 'center', elevation: 2 },
    logoutButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    header: {flexDirection: 'row',alignItems: 'center',backgroundColor: '#FFFFFF', paddingVertical: 16,paddingHorizontal: 16,
        borderBottomWidth: 1,borderBottomColor: '#E0E0E0',},
    backButton: {marginRight: 16,},
    headerTitle: {fontSize: 18,fontWeight: '400', color: '#1A1A1A',fontWeight: 'bold'},
    devToggleContainer: {marginTop: 40,padding: 16,backgroundColor: '#FFF9C4', borderRadius: 8,borderWidth: 1,
        borderColor: '#FBC02D',borderStyle: 'dashed',},
    devToggleTitle: { fontSize: 12, fontWeight: 'bold', color: '#F57F17',textAlign: 'center',marginBottom: 10,
        textTransform: 'uppercase',},
    devToggleButton: {backgroundColor: '#F57F17',paddingVertical: 12,borderRadius: 8,alignItems: 'center',},
    devToggleButtonText: {color: '#FFF',fontSize: 14,fontWeight: 'bold',},
});