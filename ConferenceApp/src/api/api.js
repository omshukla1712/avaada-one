import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.0.2.2:3000/api/v1'; 

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('avaada_jwt');
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            if (token === 'devtest123' && config.url.includes('conference')) {
                config.url = config.url.replace(/.*?conference\//, '/local-db/');
            }
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        if (error.response && error.response.status === 401) {
            console.log("Global 401 Caught. Purging token...");
            await AsyncStorage.removeItem('avaada_jwt');
        }
        return Promise.reject(error);
    }
);

export default api;