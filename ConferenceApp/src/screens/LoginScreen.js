import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Image, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import {login as apiLogin, googleLogin, demoLogin} from '../services/AuthService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function LoginScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');         
  const [password, setPassword] = useState('');   

  const { login } = useContext(AuthContext); 


  useEffect(()=>{
    GoogleSignin.configure({
      webClientId:'421987452202-hc4f02fej3066o00t71o0qostrq1epmp.apps.googleusercontent.com',
      offlineAccess:true,
    });
  },[]);

  const performGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      const idToken = userInfo.data?.idToken || userInfo.idToken;
      const email = userInfo.data?.user?.email || userInfo.user?.email;

      if (!idToken) throw new Error("No ID token returned from Google");
      await handleGoogleProxyLogin(email, idToken);

    } catch (error) {
      setIsLoading(false);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("User cancelled the login flow");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("Sign in is already in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Error", "Google Play Services not available on this device");
      } else {
        console.error("Google Sign-In Error:", error);
      }
    }
  };

  const performLocalLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }
    
    try {
      setIsLoading(true);
      const data = await demoLogin(email.trim(), password);
      login(data);
    } catch (error) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
const handleGoogleProxyLogin = async (email,idToken) => {
  try {
    setIsLoading(true);
    const data = await googleLogin(email,idToken);
    login(data);
    Alert.alert(
      "Login Success",
      `Welcome back, ${data.full_name}!`
    );
  } catch (error) {
    console.error(error);

    Alert.alert("Error", error.message || "Google login failed.");
  } finally {
    setIsLoading(false);
  }
};

return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.innerContainer}>
          <Image 
            source={require('../../assets/avaada-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
            defaultSource={{uri: 'https://via.placeholder.com/120?text=LOGO'}} // Fallback 
          />
          
          <Text style={styles.header}>Avaada One Conference Module</Text>
          <Text style={styles.subHeader}>Sign in to your account</Text>

          <View style={styles.card}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#2980b9" style={{ marginVertical: 10 }} />
            ) : (
              <>
                <TextInput 
                  style={styles.input} 
                  placeholder="Email Address" 
                  value={email} 
                  onChangeText={setEmail} 
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TextInput 
                  style={styles.input} 
                  placeholder="Password" 
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry 
                />
                
                <TouchableOpacity style={styles.primaryButton} onPress={performLocalLogin}>
                  <Text style={styles.primaryButtonText}>Sign In</Text>
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity 
                  style={styles.oauthButton} 
                  onPress={performGoogleSignIn}
                >
                  <Ionicons name="logo-google" size={20} color="#37a2db" style={styles.googleIcon} />
                  <Text style={styles.oauthButtonText}>Sign in with Google</Text>
                </TouchableOpacity>
              </> 
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  innerContainer: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { width: 180, height: 180, alignSelf: 'center', marginBottom: 20 },
  header: { fontSize: 26, fontWeight: '800', textAlign: 'center', color: '#1a252f' },
  subHeader: { fontSize: 20, textAlign: 'center', color: '#7f8c8d', marginBottom: 30, marginTop: 8 },
  card: { backgroundColor: '#fff', padding: 24, borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08,
     shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  oauthButton: {flexDirection: 'row',justifyContent: 'center',backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e6ed',
     padding: 16, borderRadius: 10, alignItems: 'center' },
  googleIcon: {marginRight: 10},
  oauthButtonText: { color: '#34495e', fontSize: 16, fontWeight: '600' },
  input: {backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e0e6ed',padding: 14,borderRadius: 8,marginBottom: 12,
    fontSize: 16,color: '#2c3e50'},
  primaryButton: {backgroundColor: '#7bdb37',padding: 16,borderRadius: 10,alignItems: 'center',marginTop: 4,},
  primaryButtonText: {color: '#fff',fontSize: 16,fontWeight: 'bold'},
  dividerContainer: {flexDirection: 'row',alignItems: 'center',marginVertical: 20},
  dividerLine: {flex: 1,height: 1, backgroundColor: '#e0e6ed'},
  dividerText: {width: 40,textAlign: 'center',color: '#7f8c8d',fontWeight: '600'},
});