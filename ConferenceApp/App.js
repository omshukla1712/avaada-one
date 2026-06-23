import React, { useContext } from 'react';
import { View, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import RoomSelectionScreen from './src/screens/RoomSelectionScreen';
import BookingFormScreen from './src/screens/BookingFormScreen';
import MyMeetingsHubScreen from './src/screens/MyMeetingsHubScreen';
import CampusScheduleScreen from './src/screens/CampusScheduleScreen';
import BookingDetailScreen from './src/screens/BookingDetailsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AdminDirectoryScreen from './src/screens/AdminDirectoryScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { currentUser, isSplashLoading } = useContext(AuthContext);
  
  if(isSplashLoading){
   return (
     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
       <ActivityIndicator size="large" color="#2980b9" />
     </View>
   );
  }

  return (
    <SafeAreaProvider>
    <NavigationContainer>
      <Stack.Navigator>
        {currentUser ? (
          <>
            <Stack.Screen 
                name="Dashboard" 
                component={DashboardScreen} 
                options={({ navigation }) => ({
                    title: 'Dashboard',
                    headerRight: () => (
                       <TouchableOpacity 
                            onPress={() => navigation.navigate('Profile')}
                            style={{ marginRight: 15 }} 
                        >
               
                           <Ionicons name="person-circle-outline" size={32} color="#7bdb37" />
                        </TouchableOpacity>
                    ),
                })}
            />

            <Stack.Screen name="RoomSelection" component={RoomSelectionScreen} options={{ title: 'Select a Room' }} />
            <Stack.Screen name="BookingForm" component={BookingFormScreen} options={{ title: 'Book Room' }} />
            <Stack.Screen name="MyMeetingsHub" component={MyMeetingsHubScreen} options={{ title: 'My Meetings' }} />
            <Stack.Screen name="CampusSchedule" component={CampusScheduleScreen} options={{ title: 'Campus Schedule' }} />
            <Stack.Screen name="AdminDirectory" component={AdminDirectoryScreen} options={{ headerShown: false }} />
            <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: 'Meeting Details' }} />
            
            <Stack.Screen 
                name="Profile" 
                component={ProfileScreen} 
                options={{ headerShown: false, presentation: 'modal' }} 
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </View>
  );
}