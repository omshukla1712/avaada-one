import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';

export const googleLogin = async (email, idToken) => {
    try {
        const response = await api.post('conference/proxy/login', {
            emailid: email,
            oauth_token: idToken,
            provider: 'google'
        });
        
        const userData = response.data.data;

        await AsyncStorage.setItem('avaada_jwt', userData.token);
        await AsyncStorage.setItem('userEmail', userData.emailid);
        await AsyncStorage.setItem('userId', userData.userid.toString());
        await AsyncStorage.setItem('employee_id', userData.employee_id.toString());

        return userData;
    } catch (error) {
         console.error('Google Login error:', error);
         throw new Error(error.response?.data?.error || 'Google login failed');
    }
};

export const demoLogin = async (email, password) => {
    try {
        if (password !== 'devtest123') {
            throw new Error("Invalid credentials.");
        }

        console.log('🚪 DEMO MODE ACTIVATED: Local User Generated');
            const mockUser = {
            userid: 123,
            full_name: "Test User",
            emailid: email || "test.user@avaada.com", 
            employee_id: "20189",
            token: "devtest123" 
        };

        await AsyncStorage.setItem('avaada_jwt', mockUser.token);
        await AsyncStorage.setItem('userEmail', mockUser.emailid);
        await AsyncStorage.setItem('userId', mockUser.userid.toString());
        await AsyncStorage.setItem('employee_id', mockUser.employee_id);

        return mockUser;
    } catch (error) {
        console.error('Demo Login error:', error);
        throw error; 
    }
};

export const logoutUser = async () => {
    await AsyncStorage.removeItem('avaada_jwt');
    await AsyncStorage.removeItem('userEmail');
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('employee_id');
};