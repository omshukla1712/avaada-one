  import React, { createContext, useState, useEffect } from 'react';
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import api from '../api/api'

  export const AuthContext = createContext();

  export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isSplashLoading, setIsSplashLoading] = useState(true);
    
    useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        if (userToken) {
          const response = await api.get('conference/proxy/validate');

          if (response.status === 200 && response.data.success) {
            setCurrentUser(response.data.data?.user || { token: userToken });
          } else {
            console.log("Token invalid, purging from storage.");
            await AsyncStorage.removeItem('avaada_jwt');
            setCurrentUser(null);
          }
        }
      } catch (e) {
       console.log("Token validation failed (Expected behavior if token is expired):", e.message);
        setCurrentUser(null);
      } finally {
        setIsSplashLoading(false);
      }
    };
    bootstrapAsync();
  }, []);

    const login = (userData) => {
      setCurrentUser(userData);
    };

    const logout = async() => {
      await AsyncStorage.removeItem('userToken'); 
      setCurrentUser(null);
    };

    return (
      <AuthContext.Provider value={{ currentUser, login, logout, isSplashLoading }}>
        {children}
      </AuthContext.Provider>
    );
  };